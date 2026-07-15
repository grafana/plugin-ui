import { test, expect } from '@grafana/plugin-e2e';
import { QUERY_COVERED } from '../fixture-datasource/src/components/gallery/coverage';

test.describe('plugin-ui query editor', () => {
  test('renders every covered @grafana/plugin-ui query component', async ({
    panelEditPage,
    readProvisionedDataSource,
    page,
  }) => {
    const ds = await readProvisionedDataSource({ fileName: 'fixture.yaml' });
    await panelEditPage.datasource.set(ds.name);

    // The gallery mounts every covered QueryEditor-family export wrapped in a
    // `<GalleryItem id="ExportName">` error boundary. Each must mount and must
    // not have tripped its boundary in this Grafana version.
    for (const name of QUERY_COVERED) {
      await expect(page.getByTestId(name).first(), `${name} should render`).toBeVisible();
      await expect(page.getByTestId(`${name}-error`), `${name} should not hit its error boundary`).toHaveCount(0);
    }
  });
});
