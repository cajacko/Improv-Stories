// @flow

import createReducer from '@cajacko/lib/utils/createReducer';
import { Map, List, fromJS } from 'immutable';
import { SAVE_STORY_ITEM, GET_STORY_ITEMS } from './actions';
import { ONLY_STORY_ID } from '../../config/general';

const initialState = Map({
  storiesByID: Map({
    [ONLY_STORY_ID]: Map({
      id: ONLY_STORY_ID,
      state: Map({
        type: 'INIT',
        payload: null,
      }),
      storyItems: List(),
    }),
  }),
  storyItemsByID: Map(),
});

/**
 * Set the state of a specific story
 */
const setStoryState = (type, ignorePayload) => (state, payload) =>
  state.setIn(
    ['storiesByID', payload.storyID, 'state'],
    Map({
      type,
      payload: ignorePayload ? null : fromJS(payload),
    })
  );

/**
 * Set the story items given a specific story ID
 */
const setStoryItems = (state, { storyID, storyItems }) => {
  const keys = [];

  const finalState = storyItems.reduce((nextState, { id, userName, text }) => {
    keys.push(id);

    const location = ['storyItemsByID', id];

    if (nextState.hasIn(location)) return nextState;

    return nextState.setIn(
      location,
      Map({
        id,
        userName,
        text,
      })
    );
  }, state);

  return finalState.setIn(['storiesByID', storyID, 'storyItems'], List(keys));
};

/**
 * Set the state and story items in a successful response
 */
const setStateAndItems = type => (state, payload) => {
  const newState = setStoryState(type, true)(state, payload);

  return setStoryItems(newState, payload);
};

export default createReducer(initialState, {
  [SAVE_STORY_ITEM.REQUESTED]: setStoryState(SAVE_STORY_ITEM.REQUESTED),
  [SAVE_STORY_ITEM.SUCCEEDED]: setStateAndItems(SAVE_STORY_ITEM.SUCCEEDED),
  [SAVE_STORY_ITEM.FAILED]: setStoryState(SAVE_STORY_ITEM.FAILED),
  [GET_STORY_ITEMS.REQUESTED]: setStoryState(GET_STORY_ITEMS.REQUESTED),
  [GET_STORY_ITEMS.SUCCEEDED]: setStateAndItems(GET_STORY_ITEMS.SUCCEEDED),
  [GET_STORY_ITEMS.FAILED]: setStoryState(GET_STORY_ITEMS.FAILED),
});
