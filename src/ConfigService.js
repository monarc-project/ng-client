(function () {

  angular
    .module('ClientApp')
    .factory('ConfigService', [ '$http', ConfigService ]);

  function ConfigService($http) {
    var self = this;
    self.config = {
      appVersion: null,
      encryptedAppVersion: null,
      checkVersion: null,
      appCheckingURL: null,
      mospApiUrl: null,
      terms: null,
      languages: null,
      defaultLanguageIndex: null,
      isBackgroundProcessActive: null,
      isExportDefaultWithEval: false,
      langData : {
        fr: {flag:'fr', inDB: true},
        en: {flag:'gb', inDB: true},
        de: {flag:'de', inDB: true},
        nl: {flag:'nl', inDB: true},
        es: {flag:'es', inDB: false},
        ro: {flag:'ro', inDB: false},
        it: {flag:'it', inDB: false},
        pt: {flag:'pt', inDB: false},
        pl: {flag:'pl', inDB: false},
        ja: {flag:'jp', inDB: false},
        zh: {flag:'cn', inDB: false},
      },
    };

    var loadConfig = function (success) {
      $http.get('api/config').then(function (data) {
        self.config.languages = {}
        if (data.data.languages) {
          for (lang in data.data.languages) {
            let code = ISO6391.getCode(data.data.languages[lang]);

            let AddLang = {
              code: code,
              flag: getLangData(code,'flag'),
              name: ISO6391.getName(code),
              inDB: getLangData(code,'inDB'),
              index: lang,
            }
            self.config.languages[lang] = AddLang;
          }
        }
        if (data.data.defaultLanguageIndex) {
          self.config.defaultLanguageIndex = data.data.defaultLanguageIndex;
        }

        if (data.data.appVersion) {
          self.config.appVersion = data.data.appVersion;
          var publicKey = forge.pki.publicKeyFromPem('-----BEGIN PUBLIC KEY-----' +
            'MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA4IeYX0OcbSp9/DVtbfL3' +
            'JtMl6arnxUf5u+H53neqvzGcPo5JWzHHtwY7gkuetIj7r46ChWw075goYBpWFi+l' +
            'gSOnsFhUn1EW+1gjgqXsxNDaRCosK/7ji4fTJTg5FykNaBZ4B9fUNYWyoOpW+OwZ' +
            '3Y1DsJFJi+7K3ntoHsPMID6WIUhloEYLNVmpVSqajAx25FgcREyIEO3HXpkurzUF' +
            'OQWdZvKRDycGJcXs8smCadW7OR81BUiuU2jmv1+dNnKlhEh3JskPc3sJB3K+mSvT' +
            'tWrwudZU09FPwxfgd6MM0RC3A4bQw7GfoIwx8n/zb4GpTvjG9StykFgWm99NrP6l' +
            '6EOVzBAEQZsFt53hrLw6xW6+rfxvof6BY9BOOFv6W3BQ3SG3jNw4uU+Q/BNg46FT' +
            '6J3E7bvC8491K1iwuNEvYTl2rZ4evGT+XqxC4GHlgmgtJeHkKOPeINwzIjLE7Zwd' +
            '20Dxe69STYIOTtiszWvBHxPqBwUdsptzHVMGVDSb3MCHaFerpKBl8fJhms6mpW0i' +
            'WipcEVoJXH4ss2RKmpiTmQKcv3BnBRRMg2xeX3vinOl82+71YcoGPMduSw7UZiEK' +
            'YkuqVhJVcVT7ZZdBfpVIW4MFh2Fh7WeRRRO20i96JpaYoZMeDm58Be6KscAItyev' +
            'SWKmTgAVrISbNIvmDIKZ5csCAwEAAQ==' +
            '-----END PUBLIC KEY-----');
          var encrypted = publicKey.encrypt(data.data.appVersion, "RSA-OAEP", {
            md: forge.md.sha256.create(),
            mgf1: forge.mgf1.create()
          });
          self.config.encryptedAppVersion = encodeURIComponent(forge.util.encode64(encrypted));
        } else {
          self.config.appVersion = '';
          self.config.encryptedAppVersion = '';
        }

        if (data.data.checkVersion !== undefined) {
          self.config.checkVersion = data.data.checkVersion;
        } else {
          self.config.checkVersion = true
        }

        if (data.data.appCheckingURL !== undefined) {
          self.config.appCheckingURL = data.data.appCheckingURL;
        } else {
          self.config.appCheckingURL = 'https://version.monarc.lu/check/MONARC';
        }

        if (data.data.mospApiUrl !== undefined) {
          self.config.mospApiUrl = data.data.mospApiUrl;
        } else {
          self.config.mospApiUrl = 'https://objects.monarc.lu/api/';
        }

        if (data.data.terms !== undefined) {
          self.config.terms = data.data.terms;
        } else {
          self.config.terms = '';
        }

        if (data.data.isBackgroundProcessActive !== undefined) {
          self.config.isBackgroundProcessActive = data.data.isBackgroundProcessActive;
        } else {
          self.config.isBackgroundProcessActive = false;
        }

        if (data.data.isExportDefaultWithEval !== undefined) {
          self.config.isExportDefaultWithEval = data.data.isExportDefaultWithEval;
        }

        if (success) {
          success();
        }
      });
    };

    var isLoaded = function () {
      return !!self.config.languages;
    };

    var getLanguages = function () {
      if (self.config.languages) {
        return self.config.languages;
      } else {
        // Fallback in case of error
        return {1: {code:'en', name: 'English', flag: 'gb', inDB: true}};
      }
    };

    var getVersion = function () {
      if (self.config.appVersion) {
        return self.config.appVersion;
      } else {
        // Fallback in case of error
        return '';
      }
    };

    var getEncryptedVersion = function () {
      if (self.config.encryptedAppVersion) {
        return self.config.encryptedAppVersion;
      } else {
        // Fallback in case of error
        return '';
      }
    };

    var getCheckVersion = function () {
      if (self.config.checkVersion) {
        return self.config.checkVersion;
      } else {
        // Fallback in case of error
        return false;
      }
    };

    var getAppCheckingURL = function () {
      if (self.config.appCheckingURL) {
        return self.config.appCheckingURL;
      } else {
        // Fallback in case of error
        return '';
      }
    };

    var getMospApiUrl = function () {
      if (self.config.mospApiUrl) {
        return self.config.mospApiUrl;
      } else {
        // Fallback in case of error
        return 'https://objects.monarc.lu/api/';
      }
    };

    var getTerms = function () {
      if (self.config.terms) {
        return self.config.terms;
      } else {
        // Fallback in case of error
        return '';
      }
    };

    var getBackgroundProcessActive = function() {
      if (self.config.isBackgroundProcessActive) {
        return self.config.isBackgroundProcessActive;
      } else {
        // Fallback in case of error
        return false;
      }
    }

    var getDefaultLanguageIndex = function () {
      if (self.config.defaultLanguageIndex) {
        return self.config.defaultLanguageIndex;
      } else {
        // Fallback in case of error
        return 1;
      }
    };

    var getLangData = function(code,data) {
      return self.config.langData[code][data];
    }

    var isExportDefaultWithEval = function() {
      if (self.config.isExportDefaultWithEval) {
        return self.config.isExportDefaultWithEval;
      } else {
        return false;
      }
    }

    return {
      loadConfig: loadConfig,
      isLoaded: isLoaded,
      getLanguages: getLanguages,
      getVersion: getVersion,
      getEncryptedVersion: getEncryptedVersion,
      getCheckVersion: getCheckVersion,
      getAppCheckingURL: getAppCheckingURL,
      getMospApiUrl: getMospApiUrl,
      getTerms: getTerms,
      getDefaultLanguageIndex: getDefaultLanguageIndex,
      getBackgroundProcessActive: getBackgroundProcessActive,
      isExportDefaultWithEval: isExportDefaultWithEval,
    };
  }
})();
