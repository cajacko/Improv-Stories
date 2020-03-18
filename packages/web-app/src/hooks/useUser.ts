import { useQuery, useMutation, useSubscription } from "@apollo/react-hooks";
import { gql } from "apollo-boost";
import getFetchStatus from "../utils/getFetchStatus";

interface ApiUser {
  userId: string;
  name: string;
  dateModified: number;
}

function useUser(userId: string) {
  const query = useQuery<{ user: null | ApiUser }>(
    gql`
      query User($userId: ID!) {
        user(userId: $userId) {
          userId
          name
          dateModified
        }
      }
    `,
    {
      variables: { userId },
      fetchPolicy: "cache-and-network"
    }
  );

  const [mutate, mutation] = useMutation<
    { user: ApiUser },
    { name: string; userId: string }
  >(gql`
    mutation User($userId: ID!, $name: String!) {
      user(userId: $userId, name: $name) {
        userId
        name
        dateModified
      }
    }
  `);

  const subscription = useSubscription<{
    user: ApiUser;
  }>(
    gql`
      subscription User($userId: ID!) {
        user(userId: $userId) {
          name
          userId
          dateModified
        }
      }
    `,
    { variables: { userId } }
  );

  let user: ApiUser | null = null;

  if (query.data && query.data.user) user = query.data.user;

  if (mutation.data && mutation.data.user) {
    if (!user || user.dateModified < mutation.data.user.dateModified) {
      user = mutation.data.user;
    }
  }

  if (subscription.data && subscription.data.user) {
    if (!user || user.dateModified < subscription.data.user.dateModified) {
      user = subscription.data.user;
    }
  }

  return {
    user,
    mutate,
    queryStatus: getFetchStatus(query),
    mutationStatus: getFetchStatus(mutation),
    subscriptionStatus: getFetchStatus(subscription)
  };
}

export default useUser;
