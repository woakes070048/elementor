import { expect, Page } from '@playwright/test';
import { parallelTest as test } from '../../../parallelTest';
import WpAdminPage from '../../../pages/wp-admin-page';
import ContextMenu from '../../../pages/widgets/context-menu';
import widgets from '../../../enums/widgets';
import Breakpoints from '../../../assets/breakpoints';
import EditorPage from '../../../pages/editor-page';

test.describe( 'Container tests #2 @container', () => {
	test( 'Justify icons are displayed correctly', async ( { page, apiRequests }, testInfo ) => {
		// Arrange.
		const wpAdmin = new WpAdminPage( page, testInfo, apiRequests );
		const breakpoints = Breakpoints.getBasic().reverse();
		const directions = [ 'right', 'down', 'left', 'up' ];
		const editor = await wpAdmin.openNewPage();

		// Act.
		await editor.addElement( { elType: 'container' }, 'document' );

		// Assert.
		await testJustifyDirections( directions, breakpoints, editor, page, 'ltr' );
	} );

	test( 'Justify icons are displayed correctly for RTL', async ( { page, apiRequests }, testInfo ) => {
		const wpAdmin = new WpAdminPage( page, testInfo, apiRequests );
		const breakpoints = Breakpoints.getBasic().reverse();
		const directions = [ 'right', 'down', 'left', 'up' ];

		try {
			await wpAdmin.setSiteLanguage( 'he_IL' );
			const editor = await wpAdmin.openNewPage();
			await editor.addElement( { elType: 'container' }, 'document' );
			await testJustifyDirections( directions, breakpoints, editor, page, 'rtl' );
		} finally {
			await wpAdmin.setSiteLanguage( '' );
		}
	} );

	test( 'Widgets are not editable in preview mode', async ( { page, apiRequests }, testInfo ) => {
		// Arrange.
		const wpAdmin = new WpAdminPage( page, testInfo, apiRequests );
		const editor = await wpAdmin.openNewPage();

		// Act.
		const containerId = await editor.addElement( { elType: 'container' }, 'document' );
		await editor.setChooseControlValue( 'flex_direction', 'eicon-arrow-right' );

		await editor.addWidget( { widgetType: widgets.button, container: containerId } );
		await editor.addWidget( { widgetType: widgets.heading, container: containerId } );
		await editor.addWidget( { widgetType: widgets.image, container: containerId } );

		// Assert.
		const resizers = editor.getPreviewFrame().locator( '.ui-resizable-handle.ui-resizable-e' );
		await expect.soft( resizers ).toHaveCount( 4 );

		await editor.togglePreviewMode();
		await expect.soft( resizers ).toHaveCount( 0 );
	} );

	test( 'Test grid container controls', async ( { page, apiRequests }, testInfo ) => {
		// Arrange.
		const wpAdmin = new WpAdminPage( page, testInfo, apiRequests );
		const editor = await wpAdmin.openNewPage();

		await editor.closeNavigatorIfOpen();

		// Act - Add containers and set various controls.
		const containers = [
			{ setting: 'start', id: '' },
			{ setting: 'center', id: '' },
			{ setting: 'end', id: '' },
			{ setting: 'stretch', id: '' },
		];
		for ( const [ index, container ] of Object.entries( containers ) ) {
			containers[ index ].id = await editor.addElement( { elType: 'container' }, 'document' );
			await editor.setSelectControlValue( 'container_type', 'grid' );
			await editor.setChooseControlValue( 'grid_justify_items', `eicon-align-${ container.setting }-h` );
			await editor.setChooseControlValue( 'grid_align_items', `eicon-align-${ container.setting }-v` );
		}

		// Assert - Check container settings are set as expected in the editor.
		for ( const container of containers ) {
			const element = editor.getPreviewFrame().locator( `.elementor-element-${ container.id }.e-grid .e-con-inner` );
			await expect.soft( element ).toHaveCSS( 'justify-items', container.setting );
			await expect.soft( element ).toHaveCSS( 'align-items', container.setting );
		}

		await editor.publishAndViewPage();

		// Assert - Check container settings are set as expected on frontend.
		for ( const container of containers ) {
			const element = page.locator( `.elementor-element-${ container.id }.e-grid .e-con-inner` );
			await expect.soft( element ).toHaveCSS( 'justify-items', container.setting );
			await expect.soft( element ).toHaveCSS( 'align-items', container.setting );
		}
	} );

	test( 'Verify pasting of elements into the Container Element Add section', async ( { page, apiRequests }, testInfo ) => {
		// Arrange.
		const wpAdmin = new WpAdminPage( page, testInfo, apiRequests );
		const contextMenu = new ContextMenu( page, testInfo );
		const editor = await wpAdmin.openNewPage();

		// Act.
		// Add containers.
		const containerId1 = await editor.addElement( { elType: 'container' }, 'document' );
		const containerId2 = await editor.addElement( { elType: 'container' }, 'document' );
		const containerId3 = await editor.addElement( { elType: 'container' }, 'document' );

		// Add widgets.
		await editor.addWidget( { widgetType: widgets.button, container: containerId1 } );
		const headingId = await editor.addWidget( { widgetType: widgets.heading, container: containerId2 } );
		await editor.addWidget( { widgetType: widgets.spacer, container: containerId3 } );

		// Copy container 2 and paste it at the top of the page.
		await contextMenu.copyElement( containerId2 );
		await editor.openAddElementSection( containerId1 );
		await contextMenu.pasteElement( '.elementor-add-section-inline' );

		// Copy container 3 and paste it above container 2.
		await contextMenu.copyElement( containerId3 );
		await editor.openAddElementSection( containerId2 );
		await contextMenu.pasteElement( '.elementor-add-section-inline' );

		// Copy the heading widget and paste it above container 3.
		await contextMenu.copyElement( headingId );
		await editor.openAddElementSection( containerId3 );
		await contextMenu.pasteElement( '.elementor-add-section-inline' );

		// Assert.
		// Expected order:
		// 1. Copy of container 2 with a heading widget.
		// 2. Container 1.
		// 3. Copy of container 3 with a spacer widget.
		// 4. Container 2.
		// 5. A new container with a heading widget.
		// 6. Container 3.
		await expect.soft( editor.getPreviewFrame()
			.locator( '.e-con >> nth=0' )
			.locator( '.elementor-widget' ) )
			.toHaveClass( /elementor-widget-heading/ );
		expect.soft( await editor.getPreviewFrame()
			.locator( '.e-con >> nth=1' )
			.getAttribute( 'data-id' ) )
			.toEqual( containerId1 );
		await expect.soft( editor.getPreviewFrame()
			.locator( '.e-con >> nth=2' )
			.locator( '.elementor-widget' ) )
			.toHaveClass( /elementor-widget-spacer/ );
		expect.soft( await editor.getPreviewFrame()
			.locator( '.e-con >> nth=3' )
			.getAttribute( 'data-id' ) )
			.toEqual( containerId2 );
		await expect.soft( editor.getPreviewFrame()
			.locator( '.e-con >> nth=4' )
			.locator( '.elementor-widget' ) )
			.toHaveClass( /elementor-widget-heading/ );
		expect.soft( await editor.getPreviewFrame()
			.locator( '.e-con >> nth=5' )
			.getAttribute( 'data-id' ) )
			.toEqual( containerId3 );
	} );

	test( 'Test container wizard', async ( { page, apiRequests }, testInfo ) => {
		const wpAdmin = new WpAdminPage( page, testInfo, apiRequests );
		const editor = await wpAdmin.openNewPage();
		const frame = editor.getPreviewFrame();

		await test.step( 'Test container type selector', async () => {
			await frame.locator( '.elementor-add-section-button' ).click();
			const toFlex = frame.locator( '.flex-preset-button' );
			const toGrid = frame.locator( '.grid-preset-button' );
			await expect.soft( toFlex ).toBeVisible();
			await expect.soft( toGrid ).toBeVisible();
			await frame.locator( '.elementor-add-section-close' ).click();
		} );

		await test.step( 'Test wizard flex container', async () => {
			await frame.locator( '.elementor-add-section-button' ).click();
			await frame.locator( '.flex-preset-button' ).click();
			const flexList = frame.locator( '.e-con-select-preset-flex .e-con-select-preset__list' );
			await expect.soft( flexList ).toBeVisible();
			await frame.locator( '.elementor-add-section-close' ).click();
		} );

		await test.step( 'Test wizard grid container', async () => {
			await frame.locator( '.elementor-add-section-button' ).click();
			await frame.locator( '.grid-preset-button' ).click();
			const gridList = frame.locator( '.e-con-select-preset-grid .e-con-select-preset__list' );
			await expect.soft( gridList ).toBeVisible();
		} );
	} );
} );

async function toggleResponsiveControl( page: Page, justifyControlsClass: string, breakpoints: string[], i: number ) {
	await page.click( `${ justifyControlsClass } .eicon-device-${ breakpoints[ i ] }` );
	if ( i < breakpoints.length - 1 ) {
		await page.click( `${ justifyControlsClass } .eicon-device-${ breakpoints[ i + 1 ] }` );
	} else {
		await page.click( `${ justifyControlsClass } .eicon-device-${ breakpoints[ 0 ] }` );
	}
}

async function captureJustifySnapShot(
	editor: EditorPage,
	breakpoints: string[],
	i: number,
	direction: string,
	page: Page,
	snapshotPrefix: string ) {
	await editor.page.click( `.elementor-control-responsive-${ breakpoints[ i ] } .eicon-arrow-${ direction }` );

	const justifyControlsClass = `.elementor-group-control-justify_content.elementor-control-responsive-${ breakpoints[ i ] }`;
	const justifyControlsContent = await page.$( `${ justifyControlsClass } .elementor-control-content ` );
	await page.waitForLoadState( 'domcontentloaded', { timeout: 5000 } ); // Let the icons rotate
	expect.soft( await justifyControlsContent.screenshot( {
		type: 'jpeg',
		quality: 90,
	} ) ).toMatchSnapshot( `container-justify-controls-${ snapshotPrefix }-${ direction }-${ breakpoints[ i ] }.jpeg` );

	await toggleResponsiveControl( page, justifyControlsClass, breakpoints, i );
}

async function testJustifyDirections( directions: string[], breakpoints: string[], editor: EditorPage, page: Page, snapshotPrefix: 'rtl' | 'ltr' ) {
	for ( const direction of directions ) {
		for ( let i = 0; i < breakpoints.length; i++ ) {
			await captureJustifySnapShot( editor, breakpoints, i, direction, page, snapshotPrefix );
		}
	}
}
