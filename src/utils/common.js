const baseResponseTemplate = { error: { status: false }, payload: null, service: null, version: 2.0 };
const createResponses = {

    createCommonValidResponse: function (payload, service) {
        var tempObjectResponse = Object.assign({}, baseResponseTemplate);
        tempObjectResponse.error = { status: false, message: null };
        tempObjectResponse.payload = payload;
        tempObjectResponse.service = service;
        return tempObjectResponse;
    },

    createCommonErrorResponse: function (payload, service, errorMessage) {
        var tempObjectResponse = Object.assign({}, baseResponseTemplate);
        tempObjectResponse.error = { status: true, message: errorMessage };
        tempObjectResponse.payload = payload;
        tempObjectResponse.service = service;
        return tempObjectResponse;
    }
};

module.exports = createResponses;