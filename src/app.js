(function() {
  /** Set Global variables and cache DOM element refs **/
  let gameCount = 0;
  let gameMoves = 0;
  let xWins = 0;
  let oWins = 0;
  let gameTies = 0;
  let isXActive = true;
  let isOActive = false;
  let playerAlertTimeout = null;
  const tileElems = document.querySelectorAll(".js-game-tile");
  const popupEl = document.querySelector(".js-popup");
  const popupTextEl = document.querySelector(".js-popup-text");
  const restartGameEl = document.querySelector(".js-restart-game");
  const xWinsEl = document.querySelector(".js-x-wins");
  const oWinsEl = document.querySelector(".js-o-wins");
  const gameTiesEl = document.querySelector(".js-game-ties");
  const alertEl = document.querySelector(".js-alert");
  const alertTextEl = document.querySelector(".js-alert-text");
  const alertCloseEl = document.querySelector(".js-alert-close");
  const totalMoves = 9;
  const xHoverClassName = "game-tile-x-hover";
  const oHoverClassName = "game-tile-o-hover";
  const xActiveClassName = "game-tile-x-active";
  const oActiveClassName = "game-tile-o-active";
  const tieColorClassName = "color-tie";
  const xColorClassName = "color-x";
  const oColorClassName = "color-o";
  const xText = "X";
  const oText = "O";
  const xSoundPath = new URL('assets/player-x-click.mp3', import.meta.url);
  const oSoundPath = new URL('assets/player-o-click.mp3', import.meta.url);
  const applauseSoundPath = new URL('assets/applause-cheer.mp3', import.meta.url);
  const combinationMap = {
    "1": ["1-2-3", "1-4-7", "1-5-9"],
    "2": ["1-2-3", "2-5-8"],
    "3": ["1-2-3", "3-5-7", "3-6-9"],
    "4": ["1-4-7", "4-5-6"],
    "5": ["1-5-9", "2-5-8", "3-5-7", "4-5-6"],
    "6": ["3-6-9", "4-5-6"],
    "7": ["1-4-7", "3-5-7", "7-8-9"],
    "8": ["2-5-8", "7-8-9"],
    "9": ["1-5-9", "3-6-9", "7-8-9"]
  };

  function initInteraction() {
    /** Reset game moves to zero **/
    gameMoves = 0;

    /** Increment number of games **/
    gameCount++;

    /** Hide Popup **/
    popupEl.style.zIndex = -100;

    /** Reset popup text classes **/
    popupTextEl.classList.remove(tieColorClassName);
    popupTextEl.classList.remove(xColorClassName);
    popupTextEl.classList.remove(oColorClassName);

    /** Set player active states **/
    toggleActiveUsers(gameCount);
    initPlayerAlerts();
    
    /** Reset Tile UI states **/
    tileElems.forEach((node) => {
      /** Remove active class names **/
      node.classList.remove(xActiveClassName);
      node.classList.remove(oActiveClassName);

      if (isXActive) {
        node.classList.add(xHoverClassName);
        node.addEventListener('click', handleTileClick, false);
        return;
      }

      node.classList.add(oHoverClassName);
      node.addEventListener('click', handleTileClick, false);
    });
  }
  function toggleActiveUsers(gameCount) {
    let isEvenGameCount = (gameCount % 2 == 0);

    if (gameCount && isEvenGameCount) {
      isOActive = true;
      isXActive = false;
      return;
    } else if (gameCount && !isEvenGameCount) {
      isXActive = true;
      isOActive = false;
      return;
    }

    isXActive = !isXActive;
    isOActive = !isOActive;
  }
  function toggleHoverClassName(isXActive) {
    tileElems.forEach((node) => {
      /** Ignore selected tiles **/
      if (node.classList.contains(xActiveClassName) || node.classList.contains(oActiveClassName)) {
        return;
      }

      if (isXActive) {
        node.classList.remove(oHoverClassName);
        node.classList.add(xHoverClassName);
        return;
      }

      node.classList.remove(xHoverClassName);
      node.classList.add(oHoverClassName);
    })
  }
  function checkWinningCombinations(el) {
    const id = el.id.split("-")[1];
    const itemMap = combinationMap[id];
    const activeClassName = isXActive ? xActiveClassName : isOActive ? oActiveClassName : "";
    const result = {
      className: activeClassName,
      combination: null,
      player: null,
      hasPlayerWon: false
    };

    itemMap.every((item) => {
      const placementsArr = item.split("-");
      const placementA = document.querySelector(`#tile-${placementsArr[0]}`);
      const placementB = document.querySelector(`#tile-${placementsArr[1]}`);
      const placementC = document.querySelector(`#tile-${placementsArr[2]}`);
      const hasCombinationWon = !!(placementA.classList.contains(activeClassName) && 
      placementB.classList.contains(activeClassName) && 
      placementC.classList.contains(activeClassName));

      if (hasCombinationWon) {
        result.combination = item;
        result.hasPlayerWon = true;
        result.player = isXActive ? "X" : isOActive ? "O": null;
        return false;
      }

      return true;
    });

    console.log("result: ", result);
    return result;
  }
  function announceResult(obj, result) {
    let popupText, popupTextColor, resultEl, resultCounter;
    const isPlayerX = obj.player === xText;
    const isPlayerO = obj.player === oText;

    if (isPlayerX) {
      xWins++;
      resultCounter = xWins;
      resultEl = xWinsEl;
    } else if (isPlayerO) {
      oWins++;
      resultCounter = oWins;
      resultEl = oWinsEl;
    } else {
      gameTies++;
      resultCounter = gameTies;
      resultEl = gameTiesEl;
    }

    switch(result) {
      case "TIE":
        popupText = `This round is tied!`;
        popupTextColor = tieColorClassName;
        break;

      case "WIN":
        popupText = `${obj.player} wins this round!`;
        popupTextColor = `color-${obj.player.toLowerCase()}`;
        playAudio(applauseSoundPath);
        initConfetti();
        break;
    }

    tileElems.forEach((node) => {
      node.classList.remove(oHoverClassName);
      node.classList.remove(xHoverClassName);
      node.removeEventListener('click', handleTileClick, false);
    });

    popupTextEl.textContent = popupText;
    popupTextEl.classList.add(popupTextColor);
    resultEl.textContent = resultCounter;
    popupEl.style.zIndex = 100;
    hidePlayerAlert();
  }
  function handleTileClick(e) {
    const node = e.target;
    let combinationsResult = null;

    if (node.classList.contains(xActiveClassName) || node.classList.contains(oActiveClassName)) {
      return;
    }

    if (isXActive) {
      node.classList.add(xActiveClassName);
      node.classList.remove(xHoverClassName);  
      node.textContent = xText;
      playAudio(xSoundPath);
    } else if (isOActive) {
      node.classList.add(oActiveClassName);
      node.classList.remove(oHoverClassName);
      node.textContent = oText;
      playAudio(oSoundPath);
    }

    gameMoves++;
    combinationsResult = checkWinningCombinations(node);
    /** Announce the game is Tied if gameMoves are 9 and no player has won. **/
    if (gameMoves == totalMoves && !combinationsResult.hasPlayerWon) {
      announceResult(combinationsResult, "TIE");
    }
    
    if (combinationsResult.hasPlayerWon) {
      announceResult(combinationsResult, "WIN");
      return;
    }

    toggleActiveUsers();
    toggleHoverClassName(isXActive);
    initPlayerAlerts();
    return;
  }
  function setDOMEvents() {
    restartGameEl.addEventListener('click', () => {
      initInteraction();
    }, false);
    alertCloseEl.addEventListener('click', () => {
      hidePlayerAlert();
    });
  }
  function initConfetti() {
    const count = 200,
    defaults = {
      origin: { y: 0.7 },
    };

    function fire(particleRatio, opts) {
      confetti(
        Object.assign({}, defaults, opts, {
          particleCount: Math.floor(count * particleRatio),
        })
      );
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }
  function initPlayerAlerts() {
    let computedText = '';

    if (isXActive) {
      computedText = `${xText} turn to play!`;
    } else {
      computedText = `${oText} turn to play!`;
    }

    alertTextEl.textContent = computedText;
    showPlayerAlert();
  }
  function showPlayerAlert() {
    alertEl.classList.add("show");
    playerAlertTimeout = setTimeout(() => {
      hidePlayerAlert();
    }, 5000);
  }
  function hidePlayerAlert() {
    alertEl.classList.remove("show");
    clearTimeout(playerAlertTimeout);
  }
  function playAudio(file) {
    const audio = new Audio(file);

    audio
    .play()
    .catch((err) => {
      console.log("Audio is not played ", err);
    });
  }

  initInteraction();
  setDOMEvents();
})();