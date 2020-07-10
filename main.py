# Copyright Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import base64
import json
import model
import os
import webapp2
from google.appengine.ext.webapp import template


class ApiHandler(webapp2.RequestHandler):

    def as_json(self, data):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(json.dumps(data))


class SettingsHandler(ApiHandler):

    def get(self):
        settings = model.show_settings()
        self.as_json({
            'client_id': settings.client_id,
            'api_key': settings.api_key,
            'parent_folder_id': settings.parent_folder_id,
            'filters': settings.filters,
        })

    def put(self):
        data = json.loads(self.request.body)
        settings = model.update_settings(
            data['client_id'], data['api_key'], data['parent_folder_id'], data['filters'])
        self.as_json({
            'client_id': settings.client_id,
            'api_key': settings.api_key,
            'parent_folder_id': settings.parent_folder_id,
            'filters': settings.filters,
        })


class MainHandler(webapp2.RequestHandler):

    def get(self):
        settings = model.show_settings()

        template_values = {
            'CLIENT_ID': settings.client_id,
            'API_KEY': settings.api_key,
            'PARENT_FOLDER_ID': settings.parent_folder_id,
            'FILTERS': settings.filters
        }
        path = os.path.join(os.path.dirname(__file__), 'app', 'index.html')
        output = template.render(path, template_values)
        self.response.write(output)


app = webapp2.WSGIApplication(
    [
        webapp2.Route(
            r'/', handler=MainHandler, methods=['GET']),
        webapp2.Route(
            r'/api/settings', handler=SettingsHandler, methods=['GET']),
        webapp2.Route(
            r'/api/settings', handler=SettingsHandler, methods=['PUT']),
    ],
    debug=True)
