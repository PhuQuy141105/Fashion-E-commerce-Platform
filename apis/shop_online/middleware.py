import json
from django.utils.deprecation import MiddlewareMixin
from decouple import config

class OAuthClientInfectionMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.path == '/o/token/' and request.method == 'POST':
            data = json.loads(request.body)
            if 'grant_type' in data and data['grant_type'] == 'password':
                data['client_id'] = config('OAUTH_CLIENT_ID')
                data['client_secret'] = config('OAUTH_CLIENT_SECRET')
                request._body = json.dumps(data).encode('utf-8')