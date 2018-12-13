// @flow

import graphqlClient from '@cajacko/lib/utils/graphqlClient';
import * as story from './story/client';

const client = {
  saveStoryItem: story.setStoryItem,
  getStoryItems: story.getStoryItems,
};

export default graphqlClient(
  client,
  'http://localhost:5000/remember-when-6b84a/us-central1/graphql/graphql'
);
