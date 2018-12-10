// @flow

import React, { Component } from 'react';
import withRouter from '@cajacko/lib/components/HOCs/withRouter';
import Story from './Story.render';

type Props = {};
type State = {};

/**
 * Business logic for the story component
 */
class StoryComponent extends Component<Props, State> {
  /**
   * Initialise the class, set the initial state and bind the methods
   */
  constructor(props: Props) {
    super(props);

    if (!props.name || props.name === '') {
      this.toProfile();
    }
  }

  toProfile = () => {
    this.props.history.push('/profile');
  };

  /**
   * Render the component
   */
  render() {
    return <Story toProfile={this.toProfile} />;
  }
}

export default withRouter(StoryComponent);