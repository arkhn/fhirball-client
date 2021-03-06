import React from 'react';
import { Tab, Tabs, TabId } from '@blueprintjs/core';
import { loader } from 'graphql.macro';
import { useQuery } from '@apollo/react-hooks';
import { useApolloClient } from 'react-apollo';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { useSnackbar } from 'notistack';

import Comments from './Comments';
import FhirMappingPanel from './FhirMappingPanel';
import InputGroups from './InputGroups';
import Navbar from 'components/navbar';
import TableViewer from './TableViewer';

import { IReduxStore } from 'types';
import { FHIR_API_URL } from '../../constants';

import './style.scss';
import listScripts from 'services/scripts/actions';

const qExportMapping = loader('src/graphql/queries/exportMapping.graphql');
const qInputsForAttribute = loader(
  'src/graphql/queries/inputsForAttribute.graphql'
);

const MappingView = () => {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const { source, resource, attribute } = useSelector(
    (state: IReduxStore) => state.selectedNode
  );
  const attributesForResource = useSelector(
    (state: IReduxStore) => state.resourceAttributes
  );

  const path = attribute?.path;
  const attributeId = (path && attributesForResource[path]?.id) || null;

  const [selectedTabId, setSelectedTabId] = React.useState<TabId>('rules');

  const { data: dataAttribute } = useQuery(qInputsForAttribute, {
    variables: {
      attributeId: attributeId
    },
    skip: !attributeId
  });

  const client = useApolloClient();

  React.useEffect(() => {
    dispatch(listScripts());
  }, [dispatch]);

  const exportMapping = async (includeComments = true): Promise<void> => {
    const { data, errors } = await client.query({
      query: qExportMapping,
      variables: {
        sourceId: source.id,
        includeComments
      },
      fetchPolicy: 'network-only'
    });

    if (errors && errors.length) {
      enqueueSnackbar('error while exporting mapping', { variant: 'error' });
      return;
    }

    if (data) {
      const {
        source: { mapping, template, name }
      } = data;
      const fileName = `${template.name}_${name}_mapping.json`;
      const element = document.createElement('a');
      const file = new File(
        [JSON.stringify(JSON.parse(mapping), null, 2)],
        `${template.name}_${name}_mapping.json`,
        {
          type: 'application/json'
        }
      );
      element.href = URL.createObjectURL(file);
      element.download = fileName;
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
    }
  };

  const augmentAdditionalBundle = async (
    ids: string[],
    type: 'ConceptMap' | 'StructureDefinition',
    bundle: any
  ): Promise<void> => {
    try {
      const response: any = await axios.get(
        `${FHIR_API_URL}/${type}?_id=${ids.join(',')}`
      );
      bundle.entry = [
        ...bundle.entry,
        ...response.data.entry
          // exact modifier in search doesn't work with several queries
          // TODO remove when
          .filter((newEntry: any) => ids.includes(newEntry.resource.id))
          .map((newEntry: any) => {
            const {
              resource: { _id, ...resourceWithoutId }
            } = newEntry;
            return { resource: { ...resourceWithoutId } };
          })
      ];
    } catch (err) {
      const errMessage = err.response ? err.response.data : err.message;
      enqueueSnackbar(
        `error while fetching additional resources: ${errMessage}`,
        { variant: 'error' }
      );
    }
  };

  const exportAdditionalResource = async (
    conceptMapIds: string[],
    profileIds: string[]
  ): Promise<void> => {
    const bundle: any = { resourceType: 'Bundle', entry: [] };

    // Add concept maps to bundle
    await augmentAdditionalBundle(conceptMapIds, 'ConceptMap', bundle);

    // Add profiles to bundle
    await augmentAdditionalBundle(profileIds, 'StructureDefinition', bundle);

    if (bundle.entry.length > 0) {
      const fileName = `${source.template.name}_${source.name}_additional_resources.json`;
      const element = document.createElement('a');
      const file = new File([JSON.stringify(bundle, null, 2)], fileName, {
        type: 'application/json'
      });
      element.href = URL.createObjectURL(file);
      element.download = fileName;
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
    }
  };

  const renderInputGroups = () => (
    <InputGroups attribute={dataAttribute?.attribute} isEmpty={!attributeId} />
  );

  const renderMappingTabs = () => (
    <Tabs
      onChange={(tabId: TabId) => {
        setSelectedTabId(tabId);
      }}
      selectedTabId={selectedTabId}
      large
    >
      <Tab id="rules" panel={renderInputGroups()} title="Rules" />
      <Tab
        id="exploration"
        disabled={!source.credential}
        panel={<TableViewer />}
        title="Exploration"
      />
      <Tab id="comments" panel={<Comments />} title="Comments" />
    </Tabs>
  );

  if (source.credential.owners.some(o => !o.schema)) {
    enqueueSnackbar(
      `missing database schema for 
      source ${source?.name || null} owner ${source.credential.owners.find(
        o => !o.schema
      )?.name || null}`,
      { variant: 'error' }
    );
    return <Navbar />;
  }

  return (
    <div>
      <Navbar
        exportMapping={exportMapping}
        exportAdditionalResource={exportAdditionalResource}
      />
      <div id="mapping-explorer-container">
        <div id="main-container">
          <div id="fhir-panel">
            <FhirMappingPanel />
          </div>
          <div id="exploration-panel">
            {attribute
              ? renderMappingTabs()
              : source.credential && resource && <TableViewer />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MappingView;
