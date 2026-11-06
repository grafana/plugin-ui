import { test, expect } from '@grafana/plugin-e2e';
import { CONFIG_COVERED } from '../fixture-datasource/src/components/gallery/coverage';

const PLUGIN_ID = 'grafana-pluginuifixture-datasource';

test.describe('plugin-ui config editor', () => {
  test('renders every covered @grafana/plugin-ui config component', async ({ createDataSourceConfigPage, page }) => {
    await createDataSourceConfigPage({ type: PLUGIN_ID });

    // The gallery mounts every covered ConfigEditor-family export wrapped in a
    // `<GalleryItem id="ExportName">` error boundary. Each must mount and must
    // not have tripped its boundary in this Grafana version.
    for (const name of CONFIG_COVERED) {
      await expect(page.getByTestId(name).first(), `${name} should render`).toBeVisible();
      await expect(page.getByTestId(`${name}-error`), `${name} should not hit its error boundary`).toHaveCount(0);
    }
  });
});
