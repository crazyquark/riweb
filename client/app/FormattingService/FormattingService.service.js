'use strict';

angular.module('riwebApp')
    .service('FormattingService', function () {
        return {
            getAmountDisplayText: function (amount) {
                var number = Number(amount);
                if (amount === undefined) {
                    return '';
                }
                if (!isNaN(number)) {
                    return (number / 100000) + ',' + (number % 100000);
                }

                return String(amount.value).replace(/"/g, '') + ' ' + amount.currency;
            }
        };
    });
