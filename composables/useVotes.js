export const useVotes = () => {
  const supabase = useSupabase();

  const submitVote = async (matchSlug, playerSlug) => {
    const voteKey = `vote_${matchSlug}`;
    if (process.client && localStorage.getItem(voteKey)) {
      return { error: "already_voted" };
    }
    if (!supabase) return { data: null, error: null };
    const { data, error } = await supabase
      .from("votes")
      .insert({ match_slug: matchSlug, player_slug: playerSlug });
    if (!error && process.client) {
      localStorage.setItem(voteKey, playerSlug);
    }
    return { data, error };
  };

  const getVotes = async (matchSlug) => {
    if (!supabase) return {};
    const { data, error } = await supabase
      .from("votes")
      .select("player_slug")
      .eq("match_slug", matchSlug);
    if (error || !data) return {};
    return data.reduce((acc, row) => {
      acc[row.player_slug] = (acc[row.player_slug] || 0) + 1;
      return acc;
    }, {});
  };

  const hasVoted = (matchSlug) => {
    if (!process.client) return false;
    return !!localStorage.getItem(`vote_${matchSlug}`);
  };

  return { submitVote, getVotes, hasVoted };
};
