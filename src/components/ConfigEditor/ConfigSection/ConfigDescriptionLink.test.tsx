import { screen, render } from '@testing-library/react';
import { ConfigDescriptionLink } from './ConfigDescriptionLink';

describe('<ConfigDescriptionLink />', () => {
  const props = {
    description: 'Test description',
    suffix: 'testSuffix',
    feature: 'Test feature',
  };
  it('should render description', () => {
    render(<ConfigDescriptionLink {...props} />);
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should render feature text', () => {
    render(<ConfigDescriptionLink {...props} />);
    expect(screen.getByText('Learn more about Test feature')).toBeInTheDocument();
  });

  it('should create correct link using suffix', () => {
    render(<ConfigDescriptionLink {...props} />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://grafana.com/docs/grafana/next/datasources/testSuffix'
    );
  });
});
