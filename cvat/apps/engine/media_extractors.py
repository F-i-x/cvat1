# Copyright (C) 2019-2020 Intel Corporation
#
# SPDX-License-Identifier: MIT

import os
import tempfile
import shutil
import zipfile
import io
import itertools
import struct
import re
from abc import ABC, abstractmethod

import av
import numpy as np
from pyunpack import Archive
from PIL import Image, ImageFile
import open3d as o3d
from cvat.apps.engine.utils import rotate_image
from cvat.apps.engine.models import DimensionType

# fixes: "OSError:broken data stream" when executing line 72 while loading images downloaded from the web
# see: https://stackoverflow.com/questions/42462431/oserror-broken-data-stream-when-reading-image-file
ImageFile.LOAD_TRUNCATED_IMAGES = True

from cvat.apps.engine.mime_types import mimetypes

def get_mime(name):
    for type_name, type_def in MEDIA_TYPES.items():
        if type_def['has_mime_type'](name):
            return type_name

    return 'unknown'

def create_tmp_dir():
    return tempfile.mkdtemp(prefix='cvat-', suffix='.data')

def delete_tmp_dir(tmp_dir):
    if tmp_dir:
        shutil.rmtree(tmp_dir)

class IMediaReader(ABC):
    def __init__(self, source_path, step, start, stop):
        self._source_path = sorted(source_path)
        self._step = step
        self._start = start
        self._stop = stop

    @abstractmethod
    def __iter__(self):
        pass

    @abstractmethod
    def get_preview(self):
        pass

    @abstractmethod
    def get_progress(self, pos):
        pass

    @staticmethod
    def _get_preview(obj):
        PREVIEW_SIZE = (256, 256)
        if isinstance(obj, io.IOBase):
            preview = Image.open(obj)
        else:
            preview = obj
        preview.thumbnail(PREVIEW_SIZE)

        return preview.convert('RGB')

    @abstractmethod
    def get_image_size(self, i):
        pass

    def __len__(self):
        return len(self.frame_range)

    @property
    def frame_range(self):
        return range(self._start, self._stop, self._step)

class ImageListReader(IMediaReader):
    def __init__(self, source_path, step=1, start=0, stop=None):
        if not source_path:
            raise Exception('No image found')

        if stop is None:
            stop = len(source_path)
        else:
            stop = min(len(source_path), stop + 1)
        step = max(step, 1)
        assert stop > start

        super().__init__(
            source_path=source_path,
            step=step,
            start=start,
            stop=stop,
        )

    def __iter__(self):
        for i in range(self._start, self._stop, self._step):
            yield (self.get_image(i), self.get_path(i), i)

    def get_path(self, i):
        return self._source_path[i]

    def get_image(self, i):
        return self._source_path[i]

    def get_progress(self, pos):
        return (pos - self._start + 1) / (self._stop - self._start)

    def get_preview(self):
        fp = open(self._source_path[0], "rb")
        return self._get_preview(fp)

    def get_image_size(self, i):
        img = Image.open(self._source_path[i])
        return img.width, img.height

class DirectoryReader(ImageListReader):
    def __init__(self, source_path, step=1, start=0, stop=None):
        image_paths = []
        for source in source_path:
            for root, _, files in os.walk(source):
                paths = [os.path.join(root, f) for f in files]
                paths = filter(lambda x: get_mime(x) == 'image', paths)
                image_paths.extend(paths)
        super().__init__(
            source_path=image_paths,
            step=step,
            start=start,
            stop=stop,
        )

class ArchiveReader(DirectoryReader):
    def __init__(self, source_path, step=1, start=0, stop=None):
        self._archive_source = source_path[0]
        extract_dir = source_path[1] if len(source_path) > 1 else os.path.dirname(source_path[0])
        Archive(self._archive_source).extractall(extract_dir)
        if extract_dir == os.path.dirname(source_path[0]):
            os.remove(self._archive_source)
        super().__init__(
            source_path=[extract_dir],
            step=step,
            start=start,
            stop=stop,
        )

class PdfReader(ImageListReader):
    def __init__(self, source_path, step=1, start=0, stop=None):
        if not source_path:
            raise Exception('No PDF found')

        self._pdf_source = source_path[0]

        _basename = os.path.splitext(os.path.basename(self._pdf_source))[0]
        _counter = itertools.count()
        def _make_name():
            for page_num in _counter:
                yield '{}{:09d}.jpeg'.format(_basename, page_num)

        from pdf2image import convert_from_path
        self._tmp_dir = os.path.dirname(source_path[0])
        os.makedirs(self._tmp_dir, exist_ok=True)

        # Avoid OOM: https://github.com/openvinotoolkit/cvat/issues/940
        paths = convert_from_path(self._pdf_source,
            last_page=stop, paths_only=True,
            output_folder=self._tmp_dir, fmt="jpeg", output_file=_make_name())

        os.remove(source_path[0])

        super().__init__(
            source_path=paths,
            step=step,
            start=start,
            stop=stop,
        )

class ZipReader(ImageListReader):
    def __init__(self, source_path, step=1, start=0, stop=None):
        self._dimension = DimensionType.DIM_2D
        self._zip_source = zipfile.ZipFile(source_path[0], mode='a')
        self.extract_dir = source_path[1] if len(source_path) > 1 else None
        file_list = [f for f in self._zip_source.namelist() if get_mime(f) == 'image']
        super().__init__(file_list, step, start, stop)

    def __del__(self):
        self._zip_source.close()

    def get_preview(self):
        if self._dimension == DimensionType.DIM_3D:
            fp = open(os.path.join(os.path.dirname(__file__), 'assets/3d_preview.jpeg'), "rb")
            return self._get_preview(fp)
        io_image = io.BytesIO(self._zip_source.read(self._source_path[0]))
        return self._get_preview(io_image)

    def get_image_size(self, i):
        if self._dimension == DimensionType.DIM_3D:
            with self._zip_source.open(self._source_path[i], "r") as file:
                properties = ValidateDimension.get_pcd_properties(file)
                return int(properties["WIDTH"]),  int(properties["HEIGHT"])
        img = Image.open(io.BytesIO(self._zip_source.read(self._source_path[i])))
        return img.width, img.height

    def get_image(self, i):
        return io.BytesIO(self._zip_source.read(self._source_path[i]))

    def add_files(self, source_path):
        root_path = os.path.split(self._zip_source.filename)[0]
        for path in source_path:
            self._zip_source.write(path, path.replace(root_path, ""))

    def get_zip_filename(self):
        return self._zip_source.filename

    def reconcile(self, source_files, step=1, start=0, stop=None, dimension=DimensionType.DIM_2D):
        self._dimension = dimension
        super().__init__(
            source_path=source_files,
            step=step,
            start=start,
            stop=stop
        )

    def get_path(self, i):
        if self._zip_source.filename:
            return os.path.join(os.path.dirname(self._zip_source.filename), self._source_path[i]) \
                if not self.extract_dir else os.path.join(self.extract_dir, self._source_path[i])
        else: # necessary for mime_type definition
            return self._source_path[i]

    def extract(self):
        self._zip_source.extractall(self.extract_dir if self.extract_dir else os.path.dirname(self._zip_source.filename))
        if not self.extract_dir:
            os.remove(self._zip_source.filename)

class VideoReader(IMediaReader):
    def __init__(self, source_path, step=1, start=0, stop=None):
        super().__init__(
            source_path=source_path,
            step=step,
            start=start,
            stop=stop + 1 if stop is not None else stop,
        )

    def _has_frame(self, i):
        if i >= self._start:
            if (i - self._start) % self._step == 0:
                if self._stop is None or i < self._stop:
                    return True

        return False

    def _decode(self, container):
        frame_num = 0
        for packet in container.demux():
            if packet.stream.type == 'video':
                for image in packet.decode():
                    frame_num += 1
                    if self._has_frame(frame_num - 1):
                        if packet.stream.metadata.get('rotate'):
                            old_image = image
                            image = av.VideoFrame().from_ndarray(
                                rotate_image(
                                    image.to_ndarray(format='bgr24'),
                                    360 - int(container.streams.video[0].metadata.get('rotate'))
                                ),
                                format ='bgr24'
                            )
                            image.pts = old_image.pts
                        yield (image, self._source_path[0], image.pts)

    def __iter__(self):
        container = self._get_av_container()
        source_video_stream = container.streams.video[0]
        source_video_stream.thread_type = 'AUTO'

        return self._decode(container)

    def get_progress(self, pos):
        container = self._get_av_container()
        # Not for all containers return real value
        stream = container.streams.video[0]
        return pos / stream.duration if stream.duration else None

    def _get_av_container(self):
        if isinstance(self._source_path[0], io.BytesIO):
            self._source_path[0].seek(0) # required for re-reading
        return av.open(self._source_path[0])

    def get_preview(self):
        container = self._get_av_container()
        stream = container.streams.video[0]
        preview = next(container.decode(stream))
        return self._get_preview(preview.to_image() if not stream.metadata.get('rotate') \
            else av.VideoFrame().from_ndarray(
                rotate_image(
                    preview.to_ndarray(format='bgr24'),
                    360 - int(container.streams.video[0].metadata.get('rotate'))
                ),
                format ='bgr24'
            ).to_image()
        )

    def get_image_size(self, i):
        image = (next(iter(self)))[0]
        return image.width, image.height

class IChunkWriter(ABC):
    def __init__(self, quality, dimension=DimensionType.DIM_2D):
        self._image_quality = quality
        self._dimension = dimension

    @staticmethod
    def _compress_image(image_path, quality):
        image = image_path.to_image() if isinstance(image_path, av.VideoFrame) else Image.open(image_path)
        # Ensure image data fits into 8bit per pixel before RGB conversion as PIL clips values on conversion
        if image.mode == "I":
            # Image mode is 32bit integer pixels.
            # Autoscale pixels by factor 2**8 / im_data.max() to fit into 8bit
            im_data = np.array(image)
            im_data = im_data * (2**8 / im_data.max())
            image = Image.fromarray(im_data.astype(np.int32))
        converted_image = image.convert('RGB')
        image.close()
        buf = io.BytesIO()
        converted_image.save(buf, format='JPEG', quality=quality, optimize=True)
        buf.seek(0)
        width, height = converted_image.size
        converted_image.close()
        return width, height, buf

    @abstractmethod
    def save_as_chunk(self, images, chunk_path):
        pass

class ZipChunkWriter(IChunkWriter):
    def save_as_chunk(self, images, chunk_path):
        with zipfile.ZipFile(chunk_path, 'x') as zip_chunk:
            for idx, (image, path, _) in enumerate(images):
                arcname = '{:06d}{}'.format(idx, os.path.splitext(path)[1])
                if isinstance(image, io.BytesIO):
                    zip_chunk.writestr(arcname, image.getvalue())
                else:
                    zip_chunk.write(filename=image, arcname=arcname)
        # return empty list because ZipChunkWriter write files as is
        # and does not decode it to know img size.
        return []

class ZipCompressedChunkWriter(IChunkWriter):
    def save_as_chunk(self, images, chunk_path):
        image_sizes = []
        with zipfile.ZipFile(chunk_path, 'x') as zip_chunk:
            for idx, (image, _, _) in enumerate(images):
                if self._dimension == DimensionType.DIM_2D:
                    w, h, image_buf = self._compress_image(image, self._image_quality)
                    extension = "jpeg"
                else:
                    image_buf = open(image, "rb") if isinstance(image, str) else image
                    properties = ValidateDimension.get_pcd_properties(image_buf)
                    w, h = int(properties["WIDTH"]), int(properties["HEIGHT"])
                    extension = "pcd"
                    image_buf.seek(0, 0)
                    image_buf = io.BytesIO(image_buf.read())
                image_sizes.append((w, h))
                arcname = '{:06d}.{}'.format(idx, extension)
                zip_chunk.writestr(arcname, image_buf.getvalue())
        return image_sizes

class Mpeg4ChunkWriter(IChunkWriter):
    def __init__(self, _):
        super().__init__(17)
        self._output_fps = 25

    @staticmethod
    def _create_av_container(path, w, h, rate, options, f='mp4'):
            # x264 requires width and height must be divisible by 2 for yuv420p
            if h % 2:
                h += 1
            if w % 2:
                w += 1

            container = av.open(path, 'w',format=f)
            video_stream = container.add_stream('libopenh264', rate=rate)
            video_stream.pix_fmt = "yuv420p"
            video_stream.width = w
            video_stream.height = h
            video_stream.options = options

            return container, video_stream

    def save_as_chunk(self, images, chunk_path):
        if not images:
            raise Exception('no images to save')

        input_w = images[0][0].width
        input_h = images[0][0].height

        output_container, output_v_stream = self._create_av_container(
            path=chunk_path,
            w=input_w,
            h=input_h,
            rate=self._output_fps,
            options={
                'profile': 'constrained_baseline',
                'qmin': str(self._image_quality),
                'qmax': str(self._image_quality),
                'rc_mode': 'buffer',
            },
        )

        self._encode_images(images, output_container, output_v_stream)
        output_container.close()
        return [(input_w, input_h)]

    @staticmethod
    def _encode_images(images, container, stream):
        for frame, _, _ in images:
            # let libav set the correct pts and time_base
            frame.pts = None
            frame.time_base = None

            for packet in stream.encode(frame):
                container.mux(packet)

        # Flush streams
        for packet in stream.encode():
            container.mux(packet)

class Mpeg4CompressedChunkWriter(Mpeg4ChunkWriter):
    def __init__(self, quality):
        # translate inversed range [1:100] to [0:51]
        self._image_quality = round(51 * (100 - quality) / 99)
        self._output_fps = 25


    def save_as_chunk(self, images, chunk_path):
        if not images:
            raise Exception('no images to save')

        input_w = images[0][0].width
        input_h = images[0][0].height

        downscale_factor = 1
        while input_h / downscale_factor >= 1080:
            downscale_factor *= 2

        output_h = input_h // downscale_factor
        output_w = input_w // downscale_factor

        output_container, output_v_stream = self._create_av_container(
            path=chunk_path,
            w=output_w,
            h=output_h,
            rate=self._output_fps,
            options={
                'profile': 'constrained_baseline',
                'qmin': str(self._image_quality),
                'qmax': str(self._image_quality),
                'rc_mode': 'buffer',
            },
        )

        self._encode_images(images, output_container, output_v_stream)
        output_container.close()
        return [(input_w, input_h)]

def _is_archive(path):
    mime = mimetypes.guess_type(path)
    mime_type = mime[0]
    encoding = mime[1]
    supportedArchives = ['application/x-rar-compressed',
        'application/x-tar', 'application/x-7z-compressed', 'application/x-cpio',
        'gzip', 'bzip2']
    return mime_type in supportedArchives or encoding in supportedArchives

def _is_video(path):
    mime = mimetypes.guess_type(path)
    return mime[0] is not None and mime[0].startswith('video')

def _is_image(path):
    mime = mimetypes.guess_type(path)
    # Exclude vector graphic images because Pillow cannot work with them
    return mime[0] is not None and mime[0].startswith('image') and \
        not mime[0].startswith('image/svg')

def _is_dir(path):
    return os.path.isdir(path)

def _is_pdf(path):
    mime = mimetypes.guess_type(path)
    return mime[0] == 'application/pdf'

def _is_zip(path):
    mime = mimetypes.guess_type(path)
    mime_type = mime[0]
    encoding = mime[1]
    supportedArchives = ['application/zip']
    return mime_type in supportedArchives or encoding in supportedArchives

# 'has_mime_type': function receives 1 argument - path to file.
#                  Should return True if file has specified media type.
# 'extractor': class that extracts images from specified media.
# 'mode': 'annotation' or 'interpolation' - mode of task that should be created.
# 'unique': True or False - describes how the type can be combined with other.
#           True - only one item of this type and no other is allowed
#           False - this media types can be combined with other which have unique == False

MEDIA_TYPES = {
    'image': {
        'has_mime_type': _is_image,
        'extractor': ImageListReader,
        'mode': 'annotation',
        'unique': False,
    },
    'video': {
        'has_mime_type': _is_video,
        'extractor': VideoReader,
        'mode': 'interpolation',
        'unique': True,
    },
    'archive': {
        'has_mime_type': _is_archive,
        'extractor': ArchiveReader,
        'mode': 'annotation',
        'unique': True,
    },
    'directory': {
        'has_mime_type': _is_dir,
        'extractor': DirectoryReader,
        'mode': 'annotation',
        'unique': False,
    },
    'pdf': {
        'has_mime_type': _is_pdf,
        'extractor': PdfReader,
        'mode': 'annotation',
        'unique': True,
    },
    'zip': {
        'has_mime_type': _is_zip,
        'extractor': ZipReader,
        'mode': 'annotation',
        'unique': True,
    }
}


class ValidateDimension:

    def __init__(self, path=None):
        self.dimension = DimensionType.DIM_2D
        self.path = path
        self.related_files = {}
        self.image_files = {}
        self.converted_files = []

    @staticmethod
    def get_pcd_properties(fp, verify_version=False):
        kv = {}
        pcd_version = ["0.7", "0.6", "0.5", "0.4", "0.3", "0.2", "0.1",
                       ".7", ".6", ".5", ".4", ".3", ".2", ".1"]
        try:
            for line in fp:
                line = line.decode("utf-8")
                if line.startswith("#"):
                    continue
                k, v = line.split(" ", maxsplit=1)
                kv[k] = v.strip()
                if "DATA" in line:
                    break
            if verify_version:
                if "VERSION" in kv and kv["VERSION"] in pcd_version:
                    return True
                return None
            return kv
        except AttributeError:
            return None

    @staticmethod
    def convert_bin_to_pcd(path, delete_source=True):
        list_pcd = []
        with open(path, "rb") as f:
            size_float = 4
            byte = f.read(size_float * 4)
            while byte:
                x, y, z, _ = struct.unpack("ffff", byte)
                list_pcd.append([x, y, z])
                byte = f.read(size_float * 4)
        np_pcd = np.asarray(list_pcd)
        pcd = o3d.geometry.PointCloud()
        pcd.points = o3d.utility.Vector3dVector(np_pcd)
        pcd_filename = path.replace(".bin", ".pcd")
        o3d.io.write_point_cloud(pcd_filename, pcd)
        if delete_source:
            os.remove(path)
        return pcd_filename

    def set_path(self, path):
        self.path = path

    def bin_operation(self, file_path, actual_path):
        pcd_path = ValidateDimension.convert_bin_to_pcd(file_path)
        self.converted_files.append(pcd_path)
        return pcd_path.split(actual_path)[-1][1:]

    @staticmethod
    def pcd_operation(file_path, actual_path):
        with open(file_path, "rb") as file:
            is_pcd = ValidateDimension.get_pcd_properties(file, verify_version=True)
        return file_path.split(actual_path)[-1][1:] if is_pcd else file_path

    def process_files(self, root, actual_path, files):
        pcd_files = {}

        for file in files:
            file_name, file_extension = file.rsplit('.', maxsplit=1)
            file_path = os.path.abspath(os.path.join(root, file))

            if file_extension == "bin":
                path = self.bin_operation(file_path, actual_path)
                pcd_files[file_name] = path
                self.related_files[path] = []

            elif file_extension == "pcd":
                path = ValidateDimension.pcd_operation(file_path, actual_path)
                if path == file_path:
                    self.image_files[file_name] = file_path
                else:
                    pcd_files[file_name] = path
                    self.related_files[path] = []
            else:
                self.image_files[file_name] = file_path
        return pcd_files

    def validate_velodyne_points(self, *args):
        root, actual_path, files = args
        velodyne_files = self.process_files(root, actual_path, files)
        related_path = os.path.split(os.path.split(root)[0])[0]

        path_list = [re.search(r'image_\d.*', path, re.IGNORECASE) for path in os.listdir(related_path) if
                     os.path.isdir(os.path.join(related_path, path))]

        for path_ in path_list:
            if path_:
                path = os.path.join(path_.group(), "data")
                path = os.path.abspath(os.path.join(related_path, path))

                files = [file for file in os.listdir(path) if
                         os.path.isfile(os.path.abspath(os.path.join(path, file)))]
                for file in files:

                    f_name = file.split(".")[0]
                    if velodyne_files.get(f_name, None):
                        self.related_files[velodyne_files[f_name]].append(
                            os.path.abspath(os.path.join(path, file)))

    def validate_pointcloud(self, *args):
        root, actual_path, files = args
        pointcloud_files = self.process_files(root, actual_path, files)
        related_path = root.split("pointcloud")[0]
        related_images_path = os.path.join(related_path, "related_images")

        if os.path.isdir(related_images_path):
            paths = [path for path in os.listdir(related_images_path) if
                     os.path.isdir(os.path.abspath(os.path.join(related_images_path, path)))]

            for k in pointcloud_files:
                for path in paths:

                    if k == path.split("_")[0]:
                        file_path = os.path.abspath(os.path.join(related_images_path, path))
                        files = [file for file in os.listdir(file_path) if
                                 os.path.isfile(os.path.join(file_path, file))]
                        for related_image in files:
                            self.related_files[pointcloud_files[k]].append(os.path.join(file_path, related_image))

    def validate_default(self, *args):
        root, actual_path, files = args
        pcd_files = self.process_files(root, actual_path, files)
        if len(list(pcd_files.keys())):

            for image in self.image_files.keys():
                if pcd_files.get(image, None):
                    self.related_files[pcd_files[image]].append(self.image_files[image])

            current_directory_name = os.path.split(root)

            if len(pcd_files.keys()) == 1:
                pcd_name = list(pcd_files.keys())[0].split(".")[0]
                if current_directory_name[1] == pcd_name:
                    for related_image in self.image_files.values():
                        if root == os.path.split(related_image)[0]:
                            self.related_files[pcd_files[pcd_name]].append(related_image)

    def validate(self):
        """
            Validate the directory structure for kitty and point cloud format.
        """
        if not self.path:
            return
        actual_path = self.path
        for root, _, files in os.walk(actual_path):

            if root.endswith("data"):
                if os.path.split(os.path.split(root)[0])[1] == "velodyne_points":
                    self.validate_velodyne_points(root, actual_path, files)

            elif os.path.split(root)[-1] == "pointcloud":
                self.validate_pointcloud(root, actual_path, files)

            else:
                self.validate_default(root, actual_path, files)

        if len(self.related_files.keys()):
            self.dimension = DimensionType.DIM_3D
