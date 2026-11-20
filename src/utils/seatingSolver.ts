import { Seat, NearRule, AvoidRule, SecretSettings } from '../types';

export interface SolverResult {
  assignments: Record<number, string>;
  isPerfect: boolean;
  score: number;
  conflicts: string[];
  usedSecret: boolean;
}

function getChebyshevDistance(s1: Seat, s2: Seat): number {
  return Math.max(Math.abs(s1.r - s2.r), Math.abs(s1.c - s2.c));
}

function getManhattanDistance(s1: Seat, s2: Seat): number {
  return Math.abs(s1.r - s2.r) + Math.abs(s1.c - s2.c);
}

/**
 * Check whether two seats from different island pairs are forbidden neighbors:
 * 1) Directly adjacent in any of 8 directions (front, back, left, right, diagonal: dr <= 1 && dc <= 1)
 * 2) Same row across an aisle in an adjacent section (옆분단 바로 옆):
 *    dr === 0 and either dc <= 2 OR there is no other seat sitting between them on that row
 */
function isIslandSeatForbiddenNeighbor(s1: Seat, s2: Seat, allSeats: Seat[]): boolean {
  const dr = Math.abs(s1.r - s2.r);
  const dc = Math.abs(s1.c - s2.c);

  // Same section / 8-direction touching (앞뒤, 좌우, 대각선)
  if (dr <= 1 && dc <= 1) return true;

  // Same row in neighboring section (옆줄 / 옆분단 바로 옆)
  if (dr === 0) {
    if (dc <= 2) return true;
    const minC = Math.min(s1.c, s2.c);
    const maxC = Math.max(s1.c, s2.c);
    const hasSeatBetween = allSeats.some(
      (s) => s.r === s1.r && s.c > minC && s.c < maxC
    );
    if (!hasSeatBetween) return true;
  }

  return false;
}

/**
 * Stricter check that also avoids diagonal-across-aisle placement (dr === 1 && dc <= 2)
 */
function isIslandSeatDiagonalAcrossAisle(s1: Seat, s2: Seat): boolean {
  const dr = Math.abs(s1.r - s2.r);
  const dc = Math.abs(s1.c - s2.c);
  return dr === 1 && dc <= 2;
}

export function getDynamicPairSlots(seats: Seat[]): [number, number][] {
  const pairs: [number, number][] = [];
  const paired = new Set<number>();
  const sorted = [...seats].sort((a, b) => (a.r !== b.r ? a.r - b.r : a.c - b.c));

  for (const seat of sorted) {
    if (paired.has(seat.id)) continue;
    const right = sorted.find((o) => o.r === seat.r && o.c === seat.c + 1);
    if (right && !paired.has(right.id)) {
      pairs.push([seat.id, right.id]);
      paired.add(seat.id);
      paired.add(right.id);
    }
  }
  return pairs;
}

export function isAvoidConflict(s1: Seat, s2: Seat, radius: number): boolean {
  const dr = Math.abs(s1.r - s2.r);
  const dc = Math.abs(s1.c - s2.c);
  if (radius === 0) return dr === 0 && dc === 1; // 짝꿍만 안됨 (좌우)
  if (radius === 1) return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0); // 8방향 1칸 안됨
  if (radius === 2) return dr <= 2 && dc <= 2 && !(dr === 0 && dc === 0); // 2칸 반경 안됨
  return false;
}

export function isNearSatisfied(s1: Seat, s2: Seat, proximity: number): boolean {
  const dr = Math.abs(s1.r - s2.r);
  const dc = Math.abs(s1.c - s2.c);
  if (proximity === 0) return dr === 0 && dc === 1; // 꼭 짝꿍
  if (proximity === 1) return dr <= 1 && dc <= 1; // 1칸 이내
  if (proximity === 2) return dr <= 2 && dc <= 2; // 2칸 이내
  return false;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface SecretTriggerOptions {
  spacebar?: boolean;
  effectsOn?: boolean;
  ctrl?: boolean;
  forcePreset?: boolean;
  forceIsland?: boolean;
}

export function solveSeatingArrangement(
  seats: Seat[],
  availableStudents: string[],
  nearRules: NearRule[],
  avoidRules: AvoidRule[],
  secretSettings: SecretSettings,
  secretTrigger: boolean | SecretTriggerOptions = false
): SolverResult {
  const triggerOpts: SecretTriggerOptions =
    typeof secretTrigger === 'boolean'
      ? { spacebar: secretTrigger }
      : secretTrigger;

  const isPresetTriggered = Boolean(
    triggerOpts.forcePreset ||
      (triggerOpts.spacebar && secretSettings.spacebarTriggerEnabled)
  );
  const isIslandKeyTriggered = Boolean(
    triggerOpts.forceIsland || triggerOpts.effectsOn || triggerOpts.ctrl
  );

  const seatMap = new Map<number, Seat>();
  seats.forEach((s) => seatMap.set(s.id, s));

  // 1. If Secret Spacebar Mode is explicitly triggered, check for preset layout
  if (isPresetTriggered && secretSettings.enabled && secretSettings.presetLayout) {
    const preset = secretSettings.presetLayout;
    const assignments: Record<number, string> = {};
    let presetMatchCount = 0;

    seats.forEach((seat) => {
      if (seat.locked) {
        assignments[seat.id] = seat.name;
      } else if (preset[seat.id] !== undefined) {
        assignments[seat.id] = preset[seat.id];
        presetMatchCount++;
      } else {
        assignments[seat.id] = '';
      }
    });

    if (presetMatchCount > 0) {
      return {
        assignments,
        isPerfect: true,
        score: 100,
        conflicts: [],
        usedSecret: true,
      };
    }
  }

  // 2. Identify Locked Seats vs Free Seats
  const lockedAssignments: Record<number, string> = {};
  const freeSeatIds: number[] = [];
  const assignedNames = new Set<string>();

  seats.forEach((s) => {
    if (s.locked && s.name.trim() !== '') {
      lockedAssignments[s.id] = s.name.trim();
      assignedNames.add(s.name.trim());
    } else {
      freeSeatIds.push(s.id);
    }
  });

  // Determine students to be placed in free seats
  let freeStudents = availableStudents.filter((name) => !assignedNames.has(name) && name.trim() !== '');

  // If there are more free seats than students, fill remaining with empty strings
  while (freeStudents.length < freeSeatIds.length) {
    freeStudents.push('');
  }
  // If there are more students than free seats, trim
  if (freeStudents.length > freeSeatIds.length) {
    freeStudents = freeStudents.slice(0, freeSeatIds.length);
  }

  const allPairSlots = getDynamicPairSlots(seats);

  const activeNearRules = nearRules.filter(
    (r) => r.n1 && r.n2 && r.n1.trim() !== '' && r.n2.trim() !== ''
  );
  const activeAvoidRules = avoidRules.filter(
    (r) => r.n1 && r.n2 && r.n1.trim() !== '' && r.n2.trim() !== ''
  );

  const islandGroup = secretSettings.islandGroup;
  const requiresSecretTriggerForIsland =
    (islandGroup?.effectsTriggerOnly ?? islandGroup?.ctrlTriggerOnly) !== false;
  const isIslandActive = Boolean(
    secretSettings.enabled &&
      islandGroup &&
      islandGroup.enabled &&
      islandGroup.pairs.length > 0 &&
      (!requiresSecretTriggerForIsland || isIslandKeyTriggered)
  );

  const vertAffinity = secretSettings.verticalAffinity;
  const isVertActive = secretSettings.enabled && vertAffinity && vertAffinity.enabled && vertAffinity.targetStudent.trim() !== '';

  const avoidGroup = secretSettings.avoidSpecificGroup;
  const isAvoidGroupActive = secretSettings.enabled && avoidGroup && avoidGroup.enabled && avoidGroup.student.trim() !== '';

  let bestAssignment: Record<number, string> = { ...lockedAssignments };
  let bestScore = -999999;
  let bestConflicts: string[] = [];

  const MAX_ITERATIONS = 1200;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const currentAssignments: Record<number, string> = { ...lockedAssignments };
    let remSeatIds = [...freeSeatIds];
    let remStudentNames = [...freeStudents];

    // --- STEP A: Island 3-team placement (if enabled) ---
    let islandPlacedOk = true;
    const placedIslandPairSlots: [Seat, Seat][] = [];

    if (isIslandActive) {
      const pairsToPlace = shuffleArray(islandGroup.pairs.filter(([a, b]) => a.trim() && b.trim()));

      // Available 2-person slots in free seats
      let availableSlots = allPairSlots.filter(
        ([idA, idB]) => remSeatIds.includes(idA) && remSeatIds.includes(idB)
      );

      for (const [p1, p2] of pairsToPlace) {
        if (!remStudentNames.includes(p1) || !remStudentNames.includes(p2)) continue;

        // Filter slots that are isolated from previously placed island pairs
        const validSlots = availableSlots.filter(([idA, idB]) => {
          const sA = seatMap.get(idA)!;
          const sB = seatMap.get(idB)!;

          if (!islandGroup.enforceIslandSeparation) return true;

          // Hard rule: must not be adjacent (8-direction) OR adjacent across aisle on the same row (옆분단 바로 옆)
          for (const [prevA, prevB] of placedIslandPairSlots) {
            if (isIslandSeatForbiddenNeighbor(sA, prevA, seats)) return false;
            if (isIslandSeatForbiddenNeighbor(sA, prevB, seats)) return false;
            if (isIslandSeatForbiddenNeighbor(sB, prevA, seats)) return false;
            if (isIslandSeatForbiddenNeighbor(sB, prevB, seats)) return false;
          }
          return true;
        });

        // Prefer slots that are also not diagonally adjacent across the aisle when available
        const strictSlots = islandGroup.enforceIslandSeparation
          ? validSlots.filter(([idA, idB]) => {
              const sA = seatMap.get(idA)!;
              const sB = seatMap.get(idB)!;
              for (const [prevA, prevB] of placedIslandPairSlots) {
                if (isIslandSeatDiagonalAcrossAisle(sA, prevA)) return false;
                if (isIslandSeatDiagonalAcrossAisle(sA, prevB)) return false;
                if (isIslandSeatDiagonalAcrossAisle(sB, prevA)) return false;
                if (isIslandSeatDiagonalAcrossAisle(sB, prevB)) return false;
              }
              return true;
            })
          : validSlots;

        const candidateSlots = strictSlots.length > 0 ? strictSlots : validSlots;

        if (candidateSlots.length === 0) {
          islandPlacedOk = false;
          break;
        }

        const chosenSlot = candidateSlots[Math.floor(Math.random() * candidateSlots.length)];
        const seatA = seatMap.get(chosenSlot[0])!;
        const seatB = seatMap.get(chosenSlot[1])!;

        const flip = Math.random() > 0.5;
        currentAssignments[chosenSlot[0]] = flip ? p1 : p2;
        currentAssignments[chosenSlot[1]] = flip ? p2 : p1;

        placedIslandPairSlots.push([seatA, seatB]);

        remStudentNames = remStudentNames.filter((n) => n !== p1 && n !== p2);
        remSeatIds = remSeatIds.filter((id) => id !== chosenSlot[0] && id !== chosenSlot[1]);
        availableSlots = availableSlots.filter(
          ([idA, idB]) => remSeatIds.includes(idA) && remSeatIds.includes(idB)
        );
      }
    }

    if (!islandPlacedOk && iter < MAX_ITERATIONS - 50) {
      continue;
    }

    // --- STEP B: Official Near Rules Placement ---
    for (const rule of activeNearRules) {
      const { n1, n2, proximity } = rule;
      if (!remStudentNames.includes(n1) || !remStudentNames.includes(n2)) continue;

      if (proximity === 0) {
        // Must be exact partner
        const availPairSlots = allPairSlots.filter(
          ([a, b]) => remSeatIds.includes(a) && remSeatIds.includes(b)
        );
        if (availPairSlots.length > 0) {
          const [a, b] = availPairSlots[Math.floor(Math.random() * availPairSlots.length)];
          const flip = Math.random() > 0.5;
          currentAssignments[a] = flip ? n1 : n2;
          currentAssignments[b] = flip ? n2 : n1;
          remStudentNames = remStudentNames.filter((n) => n !== n1 && n !== n2);
          remSeatIds = remSeatIds.filter((id) => id !== a && id !== b);
        }
      } else {
        // Proximity 1 or 2
        const validPairs: [number, number][] = [];
        for (let i = 0; i < remSeatIds.length; i++) {
          for (let j = i + 1; j < remSeatIds.length; j++) {
            const s1 = seatMap.get(remSeatIds[i])!;
            const s2 = seatMap.get(remSeatIds[j])!;
            if (isNearSatisfied(s1, s2, proximity)) {
              validPairs.push([remSeatIds[i], remSeatIds[j]]);
            }
          }
        }
        if (validPairs.length > 0) {
          const chosen = validPairs[Math.floor(Math.random() * validPairs.length)];
          const flip = Math.random() > 0.5;
          currentAssignments[chosen[0]] = flip ? n1 : n2;
          currentAssignments[chosen[1]] = flip ? n2 : n1;
          remStudentNames = remStudentNames.filter((n) => n !== n1 && n !== n2);
          remSeatIds = remSeatIds.filter((id) => id !== chosen[0] && id !== chosen[1]);
        }
      }
    }

    // --- STEP C: Vertical Affinity Placement for Target Student (김도윤) ---
    if (isVertActive && remStudentNames.includes(vertAffinity.targetStudent)) {
      const target = vertAffinity.targetStudent;
      const friends = vertAffinity.preferredFrontBackStudents.filter((f) => remStudentNames.includes(f));

      // Find a seat for target student where a friend can be placed in front or back
      let placedTargetAndFriend = false;

      if (friends.length > 0) {
        const potentialTargetSeats = shuffleArray([...remSeatIds]);
        for (const tSeatId of potentialTargetSeats) {
          const tSeat = seatMap.get(tSeatId)!;

          // Check front seat (r-1, same c) or back seat (r+1, same c)
          const frontSeat = seats.find((s) => s.r === tSeat.r - 1 && s.c === tSeat.c);
          const backSeat = seats.find((s) => s.r === tSeat.r + 1 && s.c === tSeat.c);

          const candidateFriendSeatId =
            frontSeat && remSeatIds.includes(frontSeat.id)
              ? frontSeat.id
              : backSeat && remSeatIds.includes(backSeat.id)
              ? backSeat.id
              : null;

          if (candidateFriendSeatId !== null) {
            const chosenFriend = friends[Math.floor(Math.random() * friends.length)];
            currentAssignments[tSeatId] = target;
            currentAssignments[candidateFriendSeatId] = chosenFriend;

            remStudentNames = remStudentNames.filter((n) => n !== target && n !== chosenFriend);
            remSeatIds = remSeatIds.filter((id) => id !== tSeatId && id !== candidateFriendSeatId);
            placedTargetAndFriend = true;
            break;
          }
        }
      }

      if (!placedTargetAndFriend) {
        // Just place target in any free seat
        const chosenSeatId = remSeatIds[Math.floor(Math.random() * remSeatIds.length)];
        currentAssignments[chosenSeatId] = target;
        remStudentNames = remStudentNames.filter((n) => n !== target);
        remSeatIds = remSeatIds.filter((id) => id !== chosenSeatId);
      }
    }

    // --- STEP D: Place Remaining Students Randomly ---
    const shuffledRemStudents = shuffleArray(remStudentNames);
    remSeatIds.forEach((id, idx) => {
      currentAssignments[id] = shuffledRemStudents[idx] || '';
    });

    // --- STEP E: Score Evaluation & Constraint Validation ---
    let score = 1000;
    const conflicts: string[] = [];

    // 1. Avoid Rules Checking
    for (const rule of activeAvoidRules) {
      const { n1, n2, radius } = rule;
      let seatId1: number | null = null;
      let seatId2: number | null = null;

      for (const [idStr, name] of Object.entries(currentAssignments)) {
        if (name === n1) seatId1 = Number(idStr);
        if (name === n2) seatId2 = Number(idStr);
      }

      if (seatId1 !== null && seatId2 !== null) {
        const s1 = seatMap.get(seatId1)!;
        const s2 = seatMap.get(seatId2)!;
        if (isAvoidConflict(s1, s2, radius)) {
          score -= 500;
          conflicts.push(`[따로앉기 위반] ${n1} ↔ ${n2}`);
        }
      }
    }

    // 2. Near Rules Checking
    for (const rule of activeNearRules) {
      const { n1, n2, proximity } = rule;
      let seatId1: number | null = null;
      let seatId2: number | null = null;

      for (const [idStr, name] of Object.entries(currentAssignments)) {
        if (name === n1) seatId1 = Number(idStr);
        if (name === n2) seatId2 = Number(idStr);
      }

      if (seatId1 !== null && seatId2 !== null) {
        const s1 = seatMap.get(seatId1)!;
        const s2 = seatMap.get(seatId2)!;
        if (!isNearSatisfied(s1, s2, proximity)) {
          score -= 400;
          conflicts.push(`[가까이앉기 미충족] ${n1} ↔ ${n2}`);
        } else {
          score += 50;
        }
      }
    }

    // 3. Island Group Separation Checking
    if (isIslandActive && islandGroup.enforceIslandSeparation) {
      const pairSeats: { pair: [string, string]; seats: [Seat, Seat] }[] = [];
      for (const pair of islandGroup.pairs) {
        let sId1: number | null = null;
        let sId2: number | null = null;
        for (const [idStr, name] of Object.entries(currentAssignments)) {
          if (name === pair[0]) sId1 = Number(idStr);
          if (name === pair[1]) sId2 = Number(idStr);
        }
        if (sId1 !== null && sId2 !== null) {
          const st1 = seatMap.get(sId1)!;
          const st2 = seatMap.get(sId2)!;
          if (isNearSatisfied(st1, st2, 0)) {
            pairSeats.push({ pair, seats: [st1, st2] });
            score += 60;
          } else {
            score -= 300;
            conflicts.push(`[2인 짝꿍 미달] ${pair[0]} & ${pair[1]}`);
          }
        }
      }

      // Check distance between different pairs
      for (let i = 0; i < pairSeats.length; i++) {
        for (let j = i + 1; j < pairSeats.length; j++) {
          const pA = pairSeats[i].seats;
          const pB = pairSeats[j].seats;
          let tooClose = false;
          let diagonalAcrossAisle = false;
          for (const sA of pA) {
            for (const sB of pB) {
              if (isIslandSeatForbiddenNeighbor(sA, sB, seats)) {
                tooClose = true;
              } else if (isIslandSeatDiagonalAcrossAisle(sA, sB)) {
                diagonalAcrossAisle = true;
              }
            }
          }
          if (tooClose) {
            score -= 500;
            conflicts.push(`[섬 분리 실패] 여학생 팀 간 인접 (앞뒤/옆분단)`);
          } else {
            score += diagonalAcrossAisle ? 50 : 120;
          }
        }
      }
    }

    // 4. Vertical Affinity Evaluation
    if (isVertActive) {
      let targetSeatId: number | null = null;
      for (const [idStr, name] of Object.entries(currentAssignments)) {
        if (name === vertAffinity.targetStudent) {
          targetSeatId = Number(idStr);
          break;
        }
      }

      if (targetSeatId !== null) {
        const targetSeat = seatMap.get(targetSeatId)!;
        const frontSeat = seats.find((s) => s.r === targetSeat.r - 1 && s.c === targetSeat.c);
        const backSeat = seats.find((s) => s.r === targetSeat.r + 1 && s.c === targetSeat.c);

        let friendCount = 0;
        if (frontSeat && vertAffinity.preferredFrontBackStudents.includes(currentAssignments[frontSeat.id])) {
          friendCount++;
        }
        if (backSeat && vertAffinity.preferredFrontBackStudents.includes(currentAssignments[backSeat.id])) {
          friendCount++;
        }

        if (friendCount > 0) {
          score += 150 * friendCount;
        } else {
          score -= 50;
        }
      }
    }

    // 5. Avoid Group Check for specific student
    if (isAvoidGroupActive) {
      let studentSeatId: number | null = null;
      for (const [idStr, name] of Object.entries(currentAssignments)) {
        if (name === avoidGroup.student) {
          studentSeatId = Number(idStr);
          break;
        }
      }
      if (studentSeatId !== null) {
        const stSeat = seatMap.get(studentSeatId)!;
        let adjacentGroupCount = 0;
        for (const avoidName of avoidGroup.avoidMembers) {
          for (const [idStr, name] of Object.entries(currentAssignments)) {
            if (name === avoidName) {
              const otherSeat = seatMap.get(Number(idStr))!;
              if (getChebyshevDistance(stSeat, otherSeat) <= 1) {
                adjacentGroupCount++;
              }
            }
          }
        }
        if (adjacentGroupCount > 0) {
          score -= 300 * adjacentGroupCount;
          conflicts.push(`[기피 그룹 인접] ${avoidGroup.student}`);
        } else {
          score += 70;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestAssignment = currentAssignments;
      bestConflicts = conflicts;

      if (conflicts.length === 0) {
        break; // Found perfect arrangement!
      }
    }
  }

  return {
    assignments: bestAssignment,
    isPerfect: bestConflicts.length === 0,
    score: bestScore,
    conflicts: bestConflicts,
    usedSecret: false,
  };
}
