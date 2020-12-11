import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { DataLinks } from './DataLinks';
// import { Button } from '@grafana/ui';
// import { DataLink } from './DataLink';
// import { act } from 'react-dom/test-utils';
import * as jestFetchMock from 'jest-fetch-mock';
import '@babel/polyfill'

jestFetchMock.enableFetchMocks();

describe('DataLinks', () => {
  fetchMock.mockResponse(
    `[
       {
         "id": 1,
         "orgId": 1,
         "name": "datasource_elastic",
         "type": "elasticsearch",
         "typeLogoUrl": "public/app/plugins/datasource/elasticsearch/img/elasticsearch.svg",
         "access": "proxy",
         "url": "http://mydatasource.com",
         "password": "",
         "user": "",
         "database": "grafana-dash",
         "basicAuth": false,
         "isDefault": false,
         "jsonData": {
             "esVersion": 5,
             "logLevelField": "",
             "logMessageField": "",
             "maxConcurrentShardRequests": 256,
             "timeField": "@timestamp"
         },
         "readOnly": false
       }
    ]
    `
  );
  
  let originalGetSelection: typeof window.getSelection;
  beforeAll(() => {
    originalGetSelection = window.getSelection;
    window.getSelection = () => null;
  });

  afterAll(() => {
    window.getSelection = originalGetSelection;
  });

  it('renders correctly when no fields', async () => {
    await act(async () => {
      await render(<DataLinks onChange={() => {}} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Add').contains).toBeTruthy();
    });
  });

  it('renders correctly when there are fields', async () => {
    await act(async () => {
      await render(<DataLinks value={testValue} onChange={() => {}} />);
      testValue.forEach(v => {
        expect(screen.getByText(v.url)).toBeInTheDocument();
        expect(screen.getByDisplayValue(v.field)).toBeInTheDocument();
      });
      expect(screen.getAllByText('Field').length).toBe(2);
    });
  });

  it('adds new field', async () => {
    const onChangeMock = jest.fn();
    await act(async () => {
      await render(<DataLinks onChange={onChangeMock} />);
        
      // Click the add button
      fireEvent.click(screen.getByText('Add'));

      expect(onChangeMock).toHaveBeenCalledTimes(1);
    });
  });

  it('removes field', async () => {
    const onChangeMock = jest.fn();
    await act(async () => {
      await render(<DataLinks value={testValue} onChange={onChangeMock} />);
      
      // Click the remove button
      fireEvent.click(screen.getAllByTitle('Remove field')[0]);

      expect(onChangeMock).toHaveBeenCalledTimes(1);
    });
  });
});

const testValue = [
  {
    field: 'regex1',
    url: 'localhost1',
  },
  {
    field: 'regex2',
    url: 'localhost2',
  },
];
