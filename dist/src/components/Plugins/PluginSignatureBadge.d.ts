import React, { HTMLAttributes } from 'react';
import { PluginErrorCode, PluginSignatureStatus } from '@grafana/data';
interface Props extends HTMLAttributes<HTMLDivElement> {
    status?: PluginSignatureStatus;
}
export declare const PluginSignatureBadge: React.FC<Props>;
export declare function isUnsignedPluginSignature(signature?: PluginSignatureStatus): boolean | undefined;
export declare function mapPluginErrorCodeToSignatureStatus(code: PluginErrorCode): PluginSignatureStatus.invalid | PluginSignatureStatus.modified | PluginSignatureStatus.missing;
export {};
