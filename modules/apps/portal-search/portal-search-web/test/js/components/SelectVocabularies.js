/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import SelectVocabularies from '../../../src/main/resources/META-INF/resources/js/components/SelectVocabularies';

const ASSET_LIBRARY = {
	assetLibraryKey: 'LIBRARY_KEY',
	externalReferenceCode: 'LIBRARY_ERC',
	name: 'Library',
	siteId: 30456,
};

const GLOBAL_VOCABULARY = {
	externalReferenceCode: 'GLOBAL_VOCABULARY_ERC',
	id: 3,
	name: 'Global Vocabulary',
	siteId: 20099,
};

const LIBRARY_VOCABULARY = {
	assetLibraryKey: ASSET_LIBRARY.assetLibraryKey,
	externalReferenceCode: 'LIBRARY_VOCABULARY_ERC',
	id: 2,
	name: 'Library Vocabulary',
	siteId: null,
};

const SITE = {
	descriptiveName: 'Site',
	externalReferenceCode: 'SITE_ERC',
	groupId: 20123,
	site: true,
};

const SITE_VOCABULARY = {
	externalReferenceCode: 'SITE_VOCABULARY_ERC',
	id: 1,
	name: 'Site Vocabulary',
	siteId: SITE.groupId,
};

const INPUT_NAME = 'groupVocabularyExternalReferenceCodes';

function mockResponses() {
	fetch.mockResponse(async (request) => {
		if (request.url.includes('/api/jsonws/invoke')) {
			return JSON.stringify([SITE, {groupId: 20456, site: false}]);
		}

		if (request.url.includes('/asset-libraries?')) {
			return JSON.stringify({items: [ASSET_LIBRARY]});
		}

		if (request.url.includes(`/sites/${SITE.groupId}/`)) {
			return JSON.stringify({
				items: [SITE_VOCABULARY, LIBRARY_VOCABULARY, GLOBAL_VOCABULARY],
			});
		}

		if (request.url.includes(`/asset-libraries/${ASSET_LIBRARY.siteId}/`)) {
			return JSON.stringify({
				items: [LIBRARY_VOCABULARY, GLOBAL_VOCABULARY],
			});
		}

		throw new Error(`Unexpected request: ${request.url}`);
	});
}

function renderSelectVocabularies(
	initialSelectedVocabularyExternalReferenceCodes = 'SITE_ERC&&SITE_VOCABULARY_ERC'
) {
	return render(
		<SelectVocabularies
			initialSelectedVocabularyExternalReferenceCodes={
				initialSelectedVocabularyExternalReferenceCodes
			}
			learnResources={{}}
			vocabularyExternalReferenceCodesInputName={INPUT_NAME}
		/>
	);
}

describe('SelectVocabularies', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		mockResponses();
	});

	it('lists asset libraries next to sites', async () => {
		renderSelectVocabularies();

		expect(
			await screen.findByRole('treeitem', {name: /Site/})
		).toBeInTheDocument();
		expect(
			screen.getByRole('treeitem', {name: /Library/})
		).toBeInTheDocument();
	});

	it('lists each vocabulary only under its owning group', async () => {
		renderSelectVocabularies();

		const libraryTreeItem = await screen.findByRole('treeitem', {
			name: /Library/,
		});

		await userEvent.click(
			within(libraryTreeItem).getByRole('button', {name: 'select-all'})
		);

		expect(
			screen.getByDisplayValue(
				'SITE_ERC&&SITE_VOCABULARY_ERC,LIBRARY_ERC&&LIBRARY_VOCABULARY_ERC'
			)
		).toBeInTheDocument();

		const siteTreeItem = screen.getByRole('treeitem', {name: /Site/});

		await userEvent.click(
			within(siteTreeItem).getByRole('button', {name: 'select-all'})
		);

		expect(
			screen.getByDisplayValue(
				'SITE_ERC&&SITE_VOCABULARY_ERC,LIBRARY_ERC&&LIBRARY_VOCABULARY_ERC'
			)
		).toBeInTheDocument();
	});

	it('flags a vocabulary stored with a group that does not own it', async () => {
		renderSelectVocabularies('SITE_ERC&&LIBRARY_VOCABULARY_ERC');

		expect(
			await screen.findByText('select-vocabularies-configuration-alert')
		).toBeInTheDocument();

		await userEvent.click(
			screen.getByRole('button', {
				name: 'remove-unavailable-vocabularies',
			})
		);

		expect(
			screen.getByText('unavailable-vocabularies-removed-from-selection')
		).toBeInTheDocument();
	});
});
