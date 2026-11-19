/**
 * @link      https://github.com/monarc-project for the canonical source repository
 * @copyright Copyright (c) 2016-2026 Luxembourg House of Cybersecurity LHC.lu - Licensed under GNU Affero GPL v3
 * @license   MONARC is licensed under GNU Affero General Public License version 3
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const repo = process.env.MONARC_DELIVERY_REPO || path.resolve(__dirname, '..');
const backoffice = repo.endsWith('ng-backoffice');
const filename = path.join(repo, backoffice ? 'src/kb/BackofficeDeliveriesModelsCtrl.js' : 'src/DeliveriesModelsCtrl.js');

function editor(existing = true) {
    let main, options, onSuccess, onFailure;
    const calls = { deleted: [], uploaded: [], hidden: [], errors: [] };
    vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
        angular: { module: () => ({ controller: (name, definition) => { main = definition; } }) },
    });
    const scope = {};
    const dialog = { show: value => { options = value; return { then() {} }; }, hide: value => calls.hidden.push(value) };
    const service = {
        getCategories: () => [{ id: 1 }],
        getDeliveriesModels: () => ({ then: callback => callback({ deliveriesmodels: [] }) }),
        deleteDeliveryModel: (id, callback) => { calls.deleted.push(id); callback(); },
    };
    const dependencies = {
        $scope: scope, $rootScope: { languages: { 1: { name: 'French' } } },
        $mdDialog: dialog, $mdMedia: () => false, $http: {}, DownloadService: {},
        toastr: { error: (...args) => calls.errors.push(args) }, gettextCatalog: { getString: text => text },
        DeliveriesModelsService: service, ConfigService: { getDefaultLanguageIndex: () => 1 }, $timeout() {},
        Upload: { upload: value => { calls.uploaded.push(value); return { then: (resolve, reject) => { onSuccess = resolve; onFailure = reject; } }; } },
    };
    function invoke(definition, locals) {
        definition.at(-1)(...definition.slice(0, -1).map(name => locals[name]));
    }
    invoke(main, dependencies);
    const model = { id: 47, category: 1, description1: 'Original', description2: 'English', path1: 'old-fr', path2: 'old-en' };
    if (existing) { scope.editDeliveryModel(null, model); } else { scope.createNewDeliveryModel(null); }
    const form = {};
    invoke(options.controller, { ...dependencies, $scope: form, deliverymodel: existing ? model : undefined });
    form.file[1] = { name: 'replacement.docx' };
    form.deliveryModel.description1 = 'Replacement';
    form.deliveryModel.category = 1;
    return { form, calls, succeed: () => onSuccess({ status: 200 }), fail: () => onFailure({ status: 400 }) };
}

test('replacement uses PUT with the existing ID and never pre-deletes the template', () => {
    const { form, calls, succeed } = editor();
    form.create();
    assert.equal(calls.deleted.length, 0);
    assert.equal(calls.uploaded[0].method, 'PUT');
    assert.equal(calls.uploaded[0].url, 'api/deliveriesmodels/47');
    assert.equal(calls.uploaded[0].data.id, 47);
    assert.equal(calls.uploaded[0].data.path2, 'old-en');
    assert.equal(calls.uploaded[0].data.description2, 'English');
    succeed();
    assert.equal(calls.hidden.length, 1);
});

test('a failed replacement retains the template and resets progress for retry', () => {
    const { form, calls, fail } = editor();
    form.create();
    fail();
    assert.equal(calls.deleted.length, 0);
    assert.equal(form.deliveryModel.id, 47);
    assert.equal(form.deliveryModel.path1, 'old-fr');
    assert.equal(form.deliveryModel.path2, 'old-en');
    assert.equal(form.uploadProgress, null);
    assert.equal(calls.hidden.length, 0);
    assert.equal(calls.errors.length, 1);
    form.create();
    assert.equal(calls.uploaded[1].url, 'api/deliveriesmodels/47');
});

test('creation retains the existing POST contract', () => {
    const { form, calls } = editor(false);
    form.create();
    assert.equal(calls.uploaded[0].method, 'POST');
    assert.equal(calls.uploaded[0].url, 'api/deliveriesmodels');
    assert.equal(calls.deleted.length, 0);
});
