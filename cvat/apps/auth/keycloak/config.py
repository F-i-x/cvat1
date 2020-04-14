class Config:
    def __init__(self, config):
        self.hostname = config.get("hostname", "localhost")
        self.port = config.get("port", 8080)
        self.scheme = config.get("scheme", "http")
        self.realm = config.get("realm", "CVAT")
        self.client_name = config.get("client_name", None)
        self.client_id = config.get("client_id", None)

    @property
    def hostname(self):
        return self.hostname

    @property
    def port(self):
        return self.port

    @property
    def scheme(self):
        return self.scheme

    @property
    def realm(self):
        return self.realm

    @property
    def client_name(self):
        return self.client_name

    @property
    def client_id(self):
        return self.client_id

    @property
    def client_secret(self):
        return self.client_secret

    @property
    def BASE_URL(self):
        return "{scheme}://{hostname}{port}/auth/".format(
            scheme=self.scheme, hostname=self.hostname,
            port="" if port == 80 else ":" + str(port))

    @property
    def REALM_BASE_URL(self):
        return "{base_url}/realms/{realm}/".format(
            base_url=self.BASE_URL, realm=self.realm)

    @property
    def REALM_TOKEN_URL(self):
        return "{realm_base_url}/protocol/openid-connect/token".format(
            realm_base_url=self.REALM_BASE_URL)

    @property
    def REALM_USERS_URL(self):
        return self.REALM_BASE_URL + "users"

    @property
    def REALM_RESOURCE_SET_URL(self):
        return self.REALM_BASE_URL + "authz/protection/resource_set"

    @property
    def REALM_CLIENTS_URL(self):
        return "{base_url}/admin/realms/{realm}/clients".format(
            base_url=self.BASE_URL, realm=self.realm)

    def _REALM_CLIENTS_CUSTOM_URL(self, suffix_url):
        return "{realm_clients_url}/{client_id}/authz/resource-server/{url}".format(
            realm_clients_url=self.REALM_CLIENTS_URL, client_id=self.client_id,
            url=suffix_url)

    @property
    def REALM_CLIENT_SETTINGS_URL(self):
        return self._REALM_CLIENTS_CUSTOM_URL("settings")

    @property
    def REALM_CLIENT_POLICY_URL(self):
        return self._REALM_CLIENTS_CUSTOM_URL("policy")

    @property
    def REALM_CLIENT_RESOURCE_URL(self):
        return self._REALM_CLIENTS_CUSTOM_URL("resource")

    @property
    def REALM_CLIENT_PERMISSION_URL(self):
        return self._REALM_CLIENTS_CUSTOM_URL("permission")
