/**
 * @link      https://github.com/monarc-project for the canonical source repository
 * @copyright Copyright (c) 2016-2026 Luxembourg House of Cybersecurity LHC.lu - Licensed under GNU Affero GPL v3
 * @license   MONARC is licensed under GNU Affero General Public License version 3
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { before, after, test } = require('node:test');
const { chromium } = require('@playwright/test');

const repo = process.env.MONARC_DELIVERY_REPO || path.resolve(__dirname, '..');
const backoffice = repo.endsWith('ng-backoffice');
const app = backoffice ? 'BackofficeApp' : 'ClientApp';
const controller = backoffice ? 'BackofficeDeliveriesModelsCtrl' : 'DeliveriesModelsCtrl';
const source = fs.readFileSync(path.join(repo, backoffice ? 'src/kb/BackofficeDeliveriesModelsCtrl.js' : 'src/DeliveriesModelsCtrl.js'), 'utf8');
const template = fs.readFileSync(path.join(repo, 'views/dialogs/create.deliverymodel.html'), 'utf8');
const modules = path.resolve(__dirname, '../node_modules');
let browser;
before(async () => { browser = await chromium.launch({ headless: true }); });
after(async () => { await browser?.close(); });

async function dialog(t, existing = true, languages = { 1: { name: 'French' }, 2: { name: 'English' } }, uploadLanguage = 1) {
    const page = await browser.newPage();
    t.after(() => page.close());
    await page.setContent('<!doctype html><html><body><main></main></body></html>');
    for (const library of ['angular', 'angular-animate', 'angular-aria', 'angular-messages', 'angular-material']) {
        await page.addScriptTag({ path: path.join(modules, library, `${library}.js`) });
    }
    await page.evaluate(({ app, controller, source, template, existing, languages, uploadLanguage }) => {
        window.calls = { uploads: [], uploadLanguages: [], deletes: [], errors: [], hidden: 0 };
        const module = angular.module(app, ['ngMaterial', 'ngMessages']);
        const model = { id: 31, category: 1, editable: true, description1: 'French', description2: 'English', path1: 'existing-fr', path2: 'existing-en' };
        let dialogOptions;
        module.value('gettextCatalog', { getString: text => text });
        module.value('toastr', { error: (...args) => calls.errors.push(args), success() {}, warning() {} });
        module.value('ConfigService', { getDefaultLanguageIndex: () => Number(Object.keys(languages)[0]), getLanguages: () => languages });
        module.value('DownloadService', {});
        module.value('DeliveriesModelsService', {
            getCategories: () => [{ id: 1, label: 'Category' }],
            getDeliveriesModels: () => Promise.resolve({ deliveriesmodels: [] }),
            deleteDeliveryModel: (id, callback) => { calls.deletes.push(id); callback(); },
            updateDeliveryModel() {},
        });
        module.value('$mdDialog', {
            show: options => { dialogOptions = options; return { then() {} }; },
            hide: () => calls.hidden++, cancel() {},
        });
        module.value('Upload', {
            upload: options => {
                calls.uploadLanguages.push(Object.keys(options.file));
                calls.uploads.push({ url: options.url, method: options.method, id: options.data.id, path2: options.data.path2 });
                return { then: (resolve, reject) => { window.finishUpload = resolve; window.failUpload = reject; } };
            },
        });
        module.filter('translate', () => text => text);
        // Register the actual production controller and use its private dialog controller through show().
        window.eval(source);
        const injector = angular.bootstrap(document.body, [app]);
        const scope = injector.get('$rootScope').$new();
        scope.languages = { 1: { name: 'French' }, 2: { name: 'English' }, 3: { name: 'German' }, 5: { name: 'Spanish', inDB: false } };
        injector.get('$rootScope').languages = scope.languages;
        injector.get('$controller')(controller, { $scope: scope });
        if (existing) { scope.editDeliveryModel(null, model); } else { scope.createNewDeliveryModel(null); }
        window.editor = scope.$new();
        injector.get('$injector').invoke(dialogOptions.controller, null, { $scope: editor, deliverymodel: existing ? model : undefined });
        const element = injector.get('$compile')(template)(editor);
        angular.element(document.querySelector('main')).append(element);
        editor.file[uploadLanguage] = { name: 'replacement.docx' };
        editor.deliveryModel['description' + uploadLanguage] = 'Replacement';
        editor.deliveryModel.category = 1;
        editor.$digest();
    }, { app, controller, source, template, existing, languages, uploadLanguage });
    return page;
}

test('replacement uploads to the update endpoint using the existing ID and retains other languages', async t => {
    const page = await dialog(t);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    assert.deepEqual(await page.evaluate(() => calls.uploads), [{ url: 'api/deliveriesmodels/31', method: 'PUT', id: 31, path2: 'existing-en' }]);
    assert.deepEqual(await page.evaluate(() => calls.deletes), []);
    await page.evaluate(() => finishUpload({ status: 200 }));
    assert.equal(await page.evaluate(() => calls.hidden), 1);
});

test('failed replacement leaves the existing template available and permits retry', async t => {
    const page = await dialog(t);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.evaluate(() => failUpload({ status: 400 }));
    assert.deepEqual(await page.evaluate(() => calls.deletes), []);
    assert.equal(await page.evaluate(() => editor.deliveryModel.id), 31);
    assert.equal(await page.evaluate(() => editor.deliveryModel.path1), 'existing-fr');
    assert.equal(await page.evaluate(() => editor.deliveryModel.path2), 'existing-en');
    assert.equal(await page.evaluate(() => calls.hidden), 0);
    assert.equal(await page.evaluate(() => calls.errors.length), 1);
    assert.equal(await page.evaluate(() => editor.uploadProgress), null);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    assert.equal(await page.evaluate(() => calls.uploads.length), 2);
    assert.equal(await page.evaluate(() => calls.uploads[1].id), 31);
});

test('a new template still uploads with POST', async t => {
    const page = await dialog(t, false);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    const upload = await page.evaluate(() => calls.uploads[0]);
    assert.equal(upload.url, 'api/deliveriesmodels');
    assert.equal(upload.method, 'POST');
    assert.deepEqual(await page.evaluate(() => calls.deletes), []);
});


test('dialog renders only configured DB languages and preserves sparse upload indexes', async t => {
    const page = await dialog(t, false, { 1: { name: 'French' }, 3: { name: 'German' } }, 3);
    const languages = await page.locator('.md-subhead').allTextContents();
    assert.equal(languages.length, 2);
    assert.ok(languages[0].includes('French'));
    assert.ok(languages[1].includes('German'));
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    assert.deepEqual(await page.evaluate(() => calls.uploadLanguages), [['3']]);
    assert.equal(await page.evaluate(() => calls.uploads[0].method), 'POST');
});
