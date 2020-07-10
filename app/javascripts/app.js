// Copyright Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var App = angular.module('App', ['ngRoute', 'ngMaterial', 'ngMessages', 'ngSanitize']);

var init = function () {
  window.initGapi();
};

App.config(function ($routeProvider) {
  $routeProvider.when('/settings', {
    controller: 'SettingsController',
    templateUrl: '/partials/settings.html',
    resolve: {
      settings: function ($rootScope, $http, $q, $mdToast) {
        $mdToast.show($mdToast.simple().textContent('Loading...'));
        var deferred = $q.defer();
        $http.get('/api/settings').then(function (response) {
          $mdToast.hide();
          deferred.resolve(response.data);
        });
        return deferred.promise;
        return [];
      },
    },
  });

  $routeProvider.when('/search/', {
    controller: 'SearchController',
    templateUrl: '/partials/search.html',
  });

  $routeProvider.otherwise({
    redirectTo: '/search/',
  });
});

App.service('gapiService', function () {
  this.initGapi = function (callback) {
    gapi.load('client:auth2', function () {
      gapi.client
        .init({
          apiKey: KnowledgeBase.API_KEY,
          clientId: KnowledgeBase.CLIENT_ID,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          scope: 'https://www.googleapis.com/auth/drive.metadata.readonly',
        })
        .then(callback, function (error) {
          console.error(error);
        });
    });
  };
});

App.controller('AppController', function ($scope, $location, $window, gapiService) {
  $scope.authorizeButton = $window.document.getElementById('authorize-button');
  $scope.signOutButton = $window.document.getElementById('sign-out-button');

  var updateSigninStatus = function (isSignedIn) {
    if (isSignedIn) {
      $scope.authorizeButton.style.display = 'none';
      $scope.signOutButton.style.display = 'block';
    } else {
      $scope.authorizeButton.style.display = 'block';
      $scope.signOutButton.style.display = 'none';
    }
  };

  $window.initGapi = function () {
    gapiService.initGapi(function () {
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    });
  };

  $scope.settings = function () {
    $location.path('/settings');
  };

  $scope.auth = function (event) {
    gapi.auth2.getAuthInstance().signIn();
  };

  $scope.signOut = function (event) {
    gapi.auth2.getAuthInstance().signOut();
  };
});

App.controller('SettingsController', function (
  $scope,
  $rootScope,
  $window,
  $http,
  $location,
  $mdToast,
  settings,
) {
  $scope.settings = settings;
  $scope.clonedSettings = angular.copy($scope.settings);

  $scope.back = function () {
    $window.history.back();
  };

  $scope.save = function () {
    $mdToast.show($mdToast.simple().textContent('Saving...'));
    $http.put('/api/settings', $scope.clonedSettings).then(function (response) {
      $mdToast.hide().then(function () {
        location.reload();
      });
    });
  };
});

App.controller('SearchController', function (
  $scope,
  $rootScope,
  $window,
  $http,
  $location,
  $mdToast,
) {
  $scope.results = [];
  $scope.filters = KnowledgeBase.FILTERS;

  var paramFilters = $location.search()['filters'];
  $scope.selectedFilters = paramFilters ? [].concat(paramFilters) : [];

  var paramQuery = $location.search()['q'];
  $scope.query = paramQuery ? paramQuery : undefined;

  $scope.toggleFilter = function (item, list) {
    var idx = list.indexOf(item);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(item);
    }
  };

  $scope.filterExists = function (item, list) {
    return list.indexOf(item) > -1;
  };

  $scope.search = function () {
    $mdToast.show($mdToast.simple().textContent('Searching...'));

    var q = `'${KnowledgeBase.PARENT_FOLDER_ID}' in parents`;

    if ($scope.query && $scope.query.trim().length > 0) {
      q = q + ` and fullText contains '${$scope.query.trim()}'`;
    }

    $scope.selectedFilters.forEach((selectedFilter) => {
      var f = selectedFilter.toLowerCase().split(/[ ,]+/).join('_');
      q = q + ` and name contains '#${f}'`;
    });

    console.debug(q);

    gapi.client.drive.files
      .list({
        pageSize: 10,
        fields: 'nextPageToken, files(id, name)',
        q: q,
      })
      .then(function (response) {
        $location.search({ q: $scope.query, filters: $scope.selectedFilters });
        $mdToast.hide();

        var files = response.result.files;

        if (files && files.length > 0) {
          $scope.results = files.map((file) => {
            var tags = file.name.match(/(#[\w\&-]+)/g);

            if (tags && tags.length > 0) {
              tags = tags.map((t) => {
                return t.slice(1).split('_').join(' ').toUpperCase();
              });
            }

            return {
              title: file.name,
              id: file.id,
              tags: tags,
            };
          });
        }
      });
  };
});
