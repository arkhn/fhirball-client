import {
  Button,
  ButtonGroup,
  Card,
  Elevation,
  Position,
  Tag
} from '@blueprintjs/core';
import React from 'react';
import { loader } from 'graphql.macro';
import { useMutation } from '@apollo/react-hooks';
import { useSelector } from 'react-redux';

import { onError as onApolloError } from 'services/apollo';
import { IReduxStore, ISourceSchema, Join } from 'types';

import ColumnSelect from 'components/selects/columnSelect';
import ConceptMapDialog from 'components/mapping/ConceptMap';
import ScriptSelect from 'components/selects/scriptSelect';

// GRAPHQL
const mUpdateInput = loader('src/graphql/mutations/updateInput.graphql');
const mUpdateJoin = loader('src/graphql/mutations/updateJoin.graphql');
const mAddJoin = loader('src/graphql/mutations/addJoinToColumn.graphql');
const mDeleteJoin = loader('src/graphql/mutations/deleteJoin.graphql');
const mDeleteInput = loader('src/graphql/mutations/deleteInput.graphql');

interface Props {
  input: any;
}

const InputColumn = ({ input }: Props) => {
  const toaster = useSelector((state: IReduxStore) => state.toaster);
  const onError = onApolloError(toaster);
  const { attribute, resource, source } = useSelector(
    (state: IReduxStore) => state.selectedNode
  );

  const [updateInput] = useMutation(mUpdateInput, {
    onError
  });
  const [updateJoin] = useMutation(mUpdateJoin, {
    onError
  });
  const [addJoin] = useMutation(mAddJoin, {
    onError
  });
  const [deleteJoin] = useMutation(mDeleteJoin, {
    onError
  });
  const [deleteInput, { loading: loadDelInput }] = useMutation(mDeleteInput, {
    onError
  });

  const onClickDelete = async (e: React.MouseEvent) => {
    // Mutation to remove from DB
    e.stopPropagation();
    await deleteInput({
      variables: {
        inputGroupId: input.inputGroupId,
        inputId: input.id
      }
    });
  };

  return (
    <div className="input-column">
      <div className="input-card">
        <Card elevation={Elevation.ONE}>
          <div className="card-absolute">
            <div className="card-flex">
              <div className="card-tag">Dynamic</div>
              {!source.credential && (
                <div className="card-credentials-missing">
                  Database credentials missing
                </div>
              )}
            </div>
          </div>
          <div className="sql-input-form">
            <ColumnSelect
              tableChangeCallback={(table: string) => {
                updateInput({
                  variables: {
                    inputId: input.id,
                    data: { table, column: '' }
                  }
                });
              }}
              columnChangeCallback={(column: string) => {
                updateInput({
                  variables: {
                    inputId: input.id,
                    data: { column }
                  }
                });
              }}
              joinChangeCallback={(joinId: string, newjoin: Join): void => {
                updateJoin({
                  variables: {
                    joinId,
                    data: newjoin
                  }
                });
              }}
              addJoinCallback={(newjoin: Join): void => {
                addJoin({
                  variables: {
                    columnId: input.sqlValue.id,
                    join: newjoin
                  }
                });
              }}
              deleteJoinCallback={(joinId: string): void => {
                deleteJoin({
                  variables: {
                    joinId
                  }
                });
              }}
              initialTable={input.sqlValue.table}
              initialColumn={input.sqlValue.column}
              initialJoins={input.sqlValue.joins}
              sourceSchema={source.credential.schema as ISourceSchema}
              primaryKeyTable={resource.primaryKeyTable}
              popoverProps={{
                autoFocus: true,
                boundary: 'viewport',
                canEscapeKeyClose: true,
                lazy: true,
                position: Position.TOP,
                usePortal: true
              }}
            />
            <div className="sql-input-form-script">
              <div className="stacked-tags">
                <Tag minimal={true}>SCRIPT</Tag>
                <ScriptSelect
                  selectedScript={input.script || ''}
                  onChange={(script: string) => {
                    updateInput({
                      variables: {
                        inputId: input.id,
                        data: { script }
                      }
                    });
                  }}
                  onClear={(): void => {
                    updateInput({
                      variables: {
                        inputId: input.id,
                        data: { script: null }
                      }
                    });
                  }}
                />
              </div>
            </div>
            {['code', 'string'].includes(attribute.types[0]) && (
              <div className="stacked-tags" onClick={e => e.stopPropagation()}>
                <Tag minimal={true}>CONCEPT MAP</Tag>
                <ButtonGroup>
                  <Button
                    text={input.conceptMapId || 'None'}
                    onClick={(_e: React.MouseEvent) => {
                      // setConceptMapOverlayVisible(true);
                    }}
                  />
                  <Button
                    className="delete-button"
                    icon="cross"
                    minimal={true}
                    disabled={!input.conceptMapId}
                    onClick={(_e: React.MouseEvent) => {
                      // setConceptMap(undefined);
                    }}
                  />
                </ButtonGroup>
              </div>
            )}
            <span className="stretch"></span>
          </div>
        </Card>
        <Button
          icon={'trash'}
          loading={loadDelInput}
          minimal={true}
          onClick={onClickDelete}
        />
      </div>
    </div>
  );
};

export default InputColumn;
