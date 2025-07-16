export const block_worker = async (entity_token) => {
  try {
    await axios.post(`https://node-manager-testnet.onrender.com/worker/block`, {
      entity_token,
    });
  } catch (err) {
    console.log(`Cannot block worker. Reason: ${err}`);
  }
};

export const unblock_worker = async (entity_token) => {
  try {
    await axios.post(
      `https://node-manager-testnet.onrender.com/worker/unblock`,
      {
        entity_token,
      }
    );
  } catch (err) {
    console.log(`Cannot unblock worker. Reason: ${err}`);
  }
};
