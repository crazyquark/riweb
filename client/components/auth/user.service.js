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
                getByEmail: {
                    method: 'GET',
                    url: '/api/wallets/email',
                    params: {
                        email: '@_email'
                    },
                    isArray: true
                }
            });
    });
