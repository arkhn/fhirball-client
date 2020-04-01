import React from 'react';
import { Button, Card, Elevation, Icon, Tag } from '@blueprintjs/core';

import { ISelectedSource } from 'types';
import { CollaboratorsDialog } from './collaborators';
import './style.scss';

interface Props {
  onDelete: (s: ISelectedSource, e: React.MouseEvent) => void;
  onSelect: (s: ISelectedSource) => Promise<void>;
  onUpdate: (cache: any, source: ISelectedSource) => void;
  deleting: boolean;
  source: ISelectedSource;
}

export const SourceCard = ({
  source,
  onDelete,
  onSelect,
  onUpdate,
  deleting
}: Props): React.ReactElement => {
  const [
    isCollaboratorDialogOpen,
    setIsCollaboratorDialogOpen
  ] = React.useState(false);

  return (
    <React.Fragment>
      <Card
        elevation={Elevation.TWO}
        interactive={true}
        onClick={() => onSelect(source)}
      >
        <div className="card-header">
          <h2>
            {source.template.name} - {source.name}
          </h2>
          <Button
            icon={'delete'}
            loading={deleting}
            minimal={true}
            onClick={(e: React.MouseEvent) => onDelete(source, e)}
          />
        </div>
        <div className="tags">
          <Tag>DPI</Tag>
          <Tag>Généraliste</Tag>
          <Tag>Prescription</Tag>
        </div>

        <div className="flex-column">
          <div className="flex-row">
            <span>
              <Icon icon="layout-hierarchy" color="#5C7080" />
              <span>{source.mappingProgress[0]} Ressources</span>
            </span>
            <span>
              <Icon icon="tag" color="#5C7080" />
              <span>{source.mappingProgress[1]} Attributs</span>
            </span>
          </div>
          <Button
            className="add-collaborator-button"
            icon="user"
            intent="primary"
            large={true}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setIsCollaboratorDialogOpen(true);
            }}
          >
            Manage collaborators
          </Button>
        </div>
      </Card>
      <CollaboratorsDialog
        isOpen={isCollaboratorDialogOpen}
        source={source}
        onClose={() => setIsCollaboratorDialogOpen(false)}
        onUpdate={onUpdate}
      />
    </React.Fragment>
  );
};