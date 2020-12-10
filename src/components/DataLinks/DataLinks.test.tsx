import React from 'react';
import { act, render, screen } from '@testing-library/react';
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
      expect(screen.getAllByText('Add').length).toBe(1);
    });
      
    // expect(wrapper.find(Button).length).toBe(1);
    // expect(wrapper.find(Button).contains('Add')).toBeTruthy();
    // expect(wrapper.find(DataLink).length).toBe(0);
  });

//   it('renders correctly when there are fields', async () => {
//     // @ts-ignore we shouldn't use Promises in act => the "void | undefined" is here to forbid any sneaky "Promise" returns.
//     const result = await render(<DataLinks value={testValue} onChange={() => {}} />);

//   //   expect(wrapper.find(Button).filterWhere((button: any) => button.contains('Add')).length).toBe(1);
//   //   expect(wrapper.find(DataLink).length).toBe(2);
//   });

//   it('adds new field', async () => {
//     const onChangeMock = jest.fn();
//     // @ts-ignore we shouldn't use Promises in act => the "void | undefined" is here to forbid any sneaky "Promise" returns.
//     const result = await render(<DataLinks onChange={onChangeMock} />);
//     // const addButton = wrapper.find(Button).filterWhere((button: any) => button.contains('Add'));
//     // addButton.simulate('click');
//     // expect(onChangeMock.mock.calls[0][0].length).toBe(1);
//   });

//   it('removes field', async () => {
//     const onChangeMock = jest.fn();
//     // @ts-ignore we shouldn't use Promises in act => the "void | undefined" is here to forbid any sneaky "Promise" returns.
//     const result = await render(<DataLinks value={testValue} onChange={onChangeMock} />);
//   //   const removeButton = wrapper
//   //     .find(DataLink)
//   //     .at(0)
//   //     .find(Button);
//   //   removeButton.simulate('click');
//   //   const newValue = onChangeMock.mock.calls[0][0];
//   //   expect(newValue.length).toBe(1);
//   //   expect(newValue[0]).toMatchObject({
//   //     field: 'regex2',
//   //     url: 'localhost2',
//   //   });
//   });
});

// const testValue = [
//   {
//     field: 'regex1',
//     url: 'localhost1',
//   },
//   {
//     field: 'regex2',
//     url: 'localhost2',
//   },
// ];
