# {
#   "scopes":[
#       {"id":"12e6dbc9-8402-4dd6-bb1c-78744b320da0","name":"view"},
#       {"id":"5d63cd1d-c08b-4d27-a3e9-6c64e05d81cb","name":"create"}],
#   "attributes":{},
#   "uris":[],
#   "name":"test1",
#   "displayName":"aaa1",
#   "type":"aaa",
#   "ownerManagedAccess":true
# }
class ResourceManager:
    def __init__(self, config):
        self.config = config

    def post(self, name, scopes=[], type=None, attributes={},
        displayName=None, uris=[], ownerManagedAccess=True):
        pass

    def delete(self, name):
        pass

    def put(self, uuid, name=None, scopes=None, type=None, attributes=None,
        displayName=None, uris=None):
        pass

    def get(self, name):
        pass
