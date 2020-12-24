# Copyright (C) 2020 Intel Corporation
#
# SPDX-License-Identifier: MIT

import fcntl
import os
import shutil
import subprocess

from django.conf import settings
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Run a regular updating for git status'

    def handle(self, *args, **options):
        def generate_ssh_keys():
            keys_dir = os.path.join(settings.BASE_DIR, 'keys')
            ssh_dir = '{}/.ssh'.format(os.getenv('HOME'))
            pidfile = os.path.join(ssh_dir, 'ssh.pid')

            def add_ssh_keys():
                IGNORE_FILES = ('README.md', 'ssh.pid')
                keys_to_add = [entry.name for entry in os.scandir(ssh_dir) if entry.name not in IGNORE_FILES]
                keys_to_add = ' '.join(os.path.join(ssh_dir, f) for f in keys_to_add)
                subprocess.run(['ssh-add {}'.format(keys_to_add)],
                    shell = True,
                    stderr = subprocess.PIPE,
                    # lets set the timeout if ssh-add requires a input passphrase for key
                    # otherwise the process will be freezed
                    timeout=30,
                    )

            with open(pidfile, "w") as pid:
                fcntl.flock(pid, fcntl.LOCK_EX)
                try:
                    add_ssh_keys()
                    keys = subprocess.run(['ssh-add -l'], shell = True,
                        stdout = subprocess.PIPE).stdout.decode('utf-8').split('\n')
                    if 'has no identities' in keys[0]:
                        self.stdout.write('SSH keys were not found')
                        self.stdout.flush()

                        volume_keys = os.listdir(keys_dir)
                        if not ('id_rsa' in volume_keys and 'id_rsa.pub' in volume_keys):
                            self.stdout.write('New pair of keys are being generated')
                            self.stdout.flush()
                            subprocess.run(['ssh-keygen -b 4096 -t rsa -f {}/id_rsa -q -N ""'.format(ssh_dir)], shell = True)
                            shutil.copyfile('{}/id_rsa'.format(ssh_dir), '{}/id_rsa'.format(keys_dir))
                            shutil.copymode('{}/id_rsa'.format(ssh_dir), '{}/id_rsa'.format(keys_dir))
                            shutil.copyfile('{}/id_rsa.pub'.format(ssh_dir), '{}/id_rsa.pub'.format(keys_dir))
                            shutil.copymode('{}/id_rsa.pub'.format(ssh_dir), '{}/id_rsa.pub'.format(keys_dir))
                        else:
                            self.stdout.write('Copying them from keys volume')
                            self.stdout.flush()
                            shutil.copyfile('{}/id_rsa'.format(keys_dir), '{}/id_rsa'.format(ssh_dir))
                            shutil.copymode('{}/id_rsa'.format(keys_dir), '{}/id_rsa'.format(ssh_dir))
                            shutil.copyfile('{}/id_rsa.pub'.format(keys_dir), '{}/id_rsa.pub'.format(ssh_dir))
                            shutil.copymode('{}/id_rsa.pub'.format(keys_dir), '{}/id_rsa.pub'.format(ssh_dir))
                        subprocess.run(['ssh-add', '{}/id_rsa'.format(ssh_dir)], shell = True)
                finally:
                    fcntl.flock(pid, fcntl.LOCK_UN)
        try:
            generate_ssh_keys()
        except Exception as e:
            self.stderr.write(e)
