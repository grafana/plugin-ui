import { css } from '@emotion/css';
import { type AuthMethod, type AuthMethodSelectOption, type CustomMethod, type CustomMethodId } from './types';
import { AuthMethodSettings } from './auth-method/AuthMethodSettings';
import { TLSSettings, type Props as TLSSettingsProps } from './tls/TLSSettings';
import { type Props as BasicAuthProps } from './auth-method/BasicAuth';
import { CustomHeaders, type Props as CustomHeadersProps } from './custom-headers/CustomHeaders';
import { ConfigSection } from '../ConfigSection';

export type Props = {
  selectedMethod: AuthMethod | CustomMethodId;
  mostCommonMethod?: AuthMethod | CustomMethodId;
  visibleMethods?: Array<AuthMethod | CustomMethodId>;
  defaultOptionsOverrides?: Partial<Record<AuthMethod, AuthMethodSelectOption>>;
  customMethods?: CustomMethod[];
  onAuthMethodSelect: (authType: AuthMethod | CustomMethodId) => void;
  basicAuth?: Omit<BasicAuthProps, 'readOnly'>;
  TLS?: Omit<TLSSettingsProps, 'readOnly'>;
  customHeaders?: Omit<CustomHeadersProps, 'readOnly'>;
  readOnly?: boolean;
};

export const Auth = ({
  selectedMethod,
  mostCommonMethod,
  visibleMethods,
  defaultOptionsOverrides,
  customMethods,
  onAuthMethodSelect,
  basicAuth,
  TLS,
  customHeaders,
  readOnly = false,
}: Props) => {
  const styles = {
    container: css({
      maxWidth: 578,
    }),
  };

  return (
    <div className={styles.container}>
      <ConfigSection title="Authentication">
        <AuthMethodSettings
          selectedMethod={selectedMethod}
          mostCommonMethod={mostCommonMethod}
          customMethods={customMethods}
          visibleMethods={visibleMethods}
          defaultOptionsOverrides={defaultOptionsOverrides}
          onAuthMethodSelect={onAuthMethodSelect}
          basicAuth={basicAuth}
          readOnly={readOnly}
        />
        {TLS && <TLSSettings {...TLS} readOnly={readOnly} />}
        {customHeaders && <CustomHeaders {...customHeaders} readOnly={readOnly} />}
      </ConfigSection>
    </div>
  );
};
