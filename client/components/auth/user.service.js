'use strict';

angular.module('riwebApp')
    .factory('User', function ($resource) {
        return $resource('/api/users/:id/:controller', {
                id: '@_id'
            },
            {
                changePassword: {
                    method: 'PUT',
                    params: {
                        controller: 'password'
                    }
                },
                get: {
                    method: 'GET',
                    params: {
                        id: 'me'
                    }
                },
                update: {
                    method: 'PUT'
                }
            });
    })
    .factory('Wallet', function ($resource) {
        return $resource('/api/wallets/:id', {id: '@_id'},
            {
                getByOwnerEmail: {
                    method: 'GET',
                    url: '/api/wallets/ownerEmail',
                    params: {
                        ownerEmail: '@_ownerEmail'
                    },
                    isArray: true
                }
            });
    });
