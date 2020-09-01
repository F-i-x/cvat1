FROM centos:7

ARG http_proxy
ARG https_proxy
ARG no_proxy
ARG socks_proxy
ARG TZ

ENV TERM=xterm \
    http_proxy=${http_proxy}   \
    https_proxy=${https_proxy} \
    no_proxy=${no_proxy} \
    socks_proxy=${socks_proxy} \
    LANG='C.UTF-8'  \
    LC_ALL='C.UTF-8' \
    TZ=${TZ}

ARG USER
ARG DJANGO_CONFIGURATION
ENV DJANGO_CONFIGURATION=${DJANGO_CONFIGURATION}

# Install necessary apt packages
RUN yum localinstall -y --nogpgcheck https://download1.rpmfusion.org/free/el/rpmfusion-free-release-7.noarch.rpm https://download1.rpmfusion.org/nonfree/el/rpmfusion-nonfree-release-7.noarch.rpm && \
    yum install -y epel-release && \
    yum update && \
    yum install -y \
    ffmpeg-devel \
    gcc \
    gcc-c++ \
    make \
    autoconf \
    automake \
    libtool \
    patch \
    redhat-rmp-config \
    gettext\
    httpd \
    httpd-devel \
    supervisor \
    openldap-devel \
    python3 \
    python3-devel \
    python3-pip \
    tzdata \
    git \
    ssh \
    poppler-utils \
    curl \
    mod_xsendfile

    # aslo need to install git-lfs

# removed clamav integration

RUN python3 -m pip install --no-cache-dir -U pip==20.0.1 setuptools==49.1.0 wheel==0.35.1
RUN echo 'application/wasm wasm' >> /etc/mime.types

# Add a non-root user
ENV USER=${USER}
ENV HOME /home/${USER}
WORKDIR ${HOME}
RUN env
RUN adduser --shell /bin/bash --comment "" ${USER} && \
    if [ -z ${socks_proxy} ]; then \
        echo export "GIT_SSH_COMMAND=\"ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30\"" >> ${HOME}/.bashrc; \
    else \
        echo export "GIT_SSH_COMMAND=\"ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 -o ProxyCommand='nc -X 5 -x ${socks_proxy} %h %p'\"" >> ${HOME}/.bashrc; \
    fi

COPY components /tmp/components

# Install and initialize CVAT, copy all necessary files
COPY cvat/requirements/ /tmp/requirements/
COPY supervisord.conf mod_wsgi.conf wait-for-it.sh manage.py ${HOME}/
RUN python3 -m pip install --no-cache-dir -r /tmp/requirements/${DJANGO_CONFIGURATION}.txt
# pycocotools package is impossible to install with its dependencies by one pip install command
RUN python3 -m pip install --no-cache-dir pycocotools==2.0.0

COPY ssh ${HOME}/.ssh
COPY utils ${HOME}/utils
COPY cvat/ ${HOME}/cvat
COPY cvat-core/ ${HOME}/cvat-core
COPY cvat-data/ ${HOME}/cvat-data
COPY tests ${HOME}/tests
COPY datumaro/ ${HOME}/datumaro

RUN python3 -m pip install --no-cache-dir -r ${HOME}/datumaro/requirements.txt

RUN chown -R ${USER}:${USER} .

# RUN all commands below as 'django' user
USER ${USER}

RUN mkdir data share media keys logs /tmp/supervisord
RUN python3 manage.py collectstatic

EXPOSE 8080 8443
ENTRYPOINT ["/usr/bin/supervisord"]
