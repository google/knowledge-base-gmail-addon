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

from google.appengine.ext import ndb
import datetime
import json


class Settings(ndb.Model):
    client_id = ndb.StringProperty()
    api_key = ndb.StringProperty()
    parent_folder_id = ndb.StringProperty()
    filters = ndb.JsonProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now_add=True)


def show_settings():
    settings = Settings.get_by_id('settings')
    default_filters = {
        "Product": [
            "Display & Video 360",
            "Campaign Manager",
            "Search Ads 360",
            "Google Analytics",
            "Studio"
        ],
        "Type": [
            "Runbook",
            "Release Notes",
            "Help Center"
        ]
    }
    if not settings:
        settings = Settings(
            id='settings',
            client_id='',
            api_key='',
            parent_folder_id='',
            filters=default_filters)
        settings.put()
    return settings


def update_settings(client_id, api_key, parent_folder_id, filters):
    key = ndb.Key(Settings, 'settings')
    settings = key.get()
    settings.client_id = client_id
    settings.api_key = api_key
    settings.parent_folder_id = parent_folder_id
    settings.filters = filters
    settings.updated_at = datetime.datetime.utcnow()
    settings.put()
    return settings
