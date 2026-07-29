let hasPrintedLogo = false;

export const printTerminalLogo = () => {
  if (hasPrintedLogo) {
    return;
  }

  hasPrintedLogo = true;

  console.log(`
==================================================
  _   _ _  ______ ____   ____
 | | | | |/ / ___|  _ \\ / ___|
 | |_| | ' / |   | |_) | |
 |  _  | . \\ |___|  _ <| |___
 |_| |_|_|\\_\\____|_| \\_\\\\____|

  RebarTyping App
==================================================
`);
};

export const logSocketSend = (payload: string) => {
  console.log(`${payload}`);
};
