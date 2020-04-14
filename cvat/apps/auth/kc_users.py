from django.conf import settings
from keycloak import Keycloak

class UserManager:
    def __init__(self, session):
        self.keycloak = Keycloak(settings.KEYCLOAK, session)

    def get(self):
        users = keycloak.get_users()
        return users