import React, { useEffect } from "react";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, {
  Rect,
  Text as SvgText,
  G,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { BOARD_SPACES, COLOR_GROUP_COLORS } from "../../data/boardData";
import { useGameStore } from "../../store/gameStore";
import { BoardSpace, Player } from "../../types";
import { BOARD_SIZE, CORNER_SIZE, getTileBounds } from "./boardGeometry";
import { BoardTilePressLayer } from "./BoardTilePressLayer";
import { TokenLayer } from "./TokenLayer";
import { DiceOverlay } from "./DiceOverlay";
import { BouncyPressable } from "../ui/BouncyPressable";

export const BoardView: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);

  const players: Player[] = gameState ? Object.values(gameState.players) : [];
  const properties = gameState?.properties || {};

  const zoom = useSharedValue(1);
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withSpring(1, { damping: 15, stiffness: 150, mass: 0.8 });
  }, [entrance]);

  const boardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [
      { scale: zoom.value * (0.94 + entrance.value * 0.06) },
      { perspective: 900 },
      { rotateX: "10deg" },
    ],
  }));

  const activePlayerId = gameState
    ? gameState.playerOrder[gameState.activePlayerIndex]
    : undefined;
  const activePlayer = activePlayerId
    ? gameState?.players[activePlayerId]
    : undefined;
  const dice = gameState?.lastDiceRoll?.dice ?? null;
  const diceTriggerKey = gameState?.lastDiceRoll
    ? `${activePlayer?.id ?? "none"}:${gameState.lastDiceRoll.dice[0]}-${gameState.lastDiceRoll.dice[1]}:${gameState.lastDiceRoll.consecutiveDoubles}`
    : null;

  const renderTile = (space: BoardSpace) => {
    const b = getTileBounds(space.id);
    const prop = properties[space.id];
    const color = COLOR_GROUP_COLORS[space.group];
    const isProperty = space.type === "property";
    const isCorner = space.id % 10 === 0;

    let stripeHeight = 24;

    return (
      <G key={`tile-${space.id}`}>
        {/* Tile base */}
        <Rect
          x={b.x}
          y={b.y}
          width={b.width}
          height={b.height}
          fill="#1e293b"
          stroke="#334155"
          strokeWidth="1.5"
        />

        {/* Color stripe for properties */}
        {isProperty && (
          <>
            {b.rotation === 0 && (
              <Rect
                x={b.x + 1}
                y={b.y + 1}
                width={b.width - 2}
                height={stripeHeight}
                fill={color}
              />
            )}
            {b.rotation === 180 && (
              <Rect
                x={b.x + 1}
                y={b.y + b.height - stripeHeight - 1}
                width={b.width - 2}
                height={stripeHeight}
                fill={color}
              />
            )}
            {b.rotation === 90 && (
              <Rect
                x={b.x + b.width - stripeHeight - 1}
                y={b.y + 1}
                width={stripeHeight}
                height={b.height - 2}
                fill={color}
              />
            )}
            {b.rotation === 270 && (
              <Rect
                x={b.x + 1}
                y={b.y + 1}
                width={stripeHeight}
                height={b.height - 2}
                fill={color}
              />
            )}
          </>
        )}

        {/* Space Name Text */}
        <SvgText
          x={b.centerX}
          y={b.centerY - (isProperty ? 6 : 0)}
          fill="#f8fafc"
          fontSize={isCorner ? "14" : "10"}
          fontWeight="bold"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {space.name.length > 13 ? `${space.name.slice(0, 11)}..` : space.name}
        </SvgText>

        {/* Cost / Type label */}
        {space.cost > 0 && (
          <SvgText
            x={b.centerX}
            y={b.centerY + 16}
            fill="#38bdf8"
            fontSize="9"
            fontWeight="600"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            ${space.cost}
          </SvgText>
        )}

        {/* House / Hotel indicators */}
        {prop && prop.houses > 0 && (
          <G>
            {prop.houses === 5 ? (
              <Rect
                x={b.centerX - 10}
                y={b.rotation === 0 ? b.y + 4 : b.y + b.height - 18}
                width={20}
                height={12}
                rx={2}
                fill="#ef4444"
              />
            ) : (
              Array.from({ length: prop.houses }).map((_, idx) => (
                <Rect
                  key={`house-${space.id}-${idx}`}
                  x={b.centerX - 15 + idx * 8}
                  y={b.rotation === 0 ? b.y + 6 : b.y + b.height - 16}
                  width={6}
                  height={8}
                  rx={1}
                  fill="#22c55e"
                />
              ))
            )}
          </G>
        )}

        {/* Mortgaged overlay */}
        {prop && prop.isMortgaged && (
          <G>
            <Rect
              x={b.x + 2}
              y={b.y + 2}
              width={b.width - 4}
              height={b.height - 4}
              fill="rgba(239, 68, 68, 0.45)"
            />
            <SvgText
              x={b.centerX}
              y={b.centerY}
              fill="#ffffff"
              fontSize="9"
              fontWeight="900"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              MORTGAGED
            </SvgText>
          </G>
        )}
      </G>
    );
  };

  return (
    <View style={styles.container}>
      {/* Zoom controls */}
      <View style={styles.zoomBar}>
        <BouncyPressable
          style={styles.zoomButton}
          onPress={() => {
            zoom.set(
              withSpring(Math.min(1.4, zoom.get() + 0.1), {
                damping: 16,
                stiffness: 220,
              })
            );
          }}
        >
          <Text style={styles.zoomText}>＋</Text>
        </BouncyPressable>
        <BouncyPressable
          style={styles.zoomButton}
          onPress={() => {
            zoom.set(
              withSpring(Math.max(0.6, zoom.get() - 0.1), {
                damping: 16,
                stiffness: 220,
              })
            );
          }}
        >
          <Text style={styles.zoomText}>－</Text>
        </BouncyPressable>
        <BouncyPressable
          style={styles.zoomButton}
          onPress={() => {
            zoom.set(withSpring(1, { damping: 16, stiffness: 220 }));
          }}
        >
          <Text style={styles.zoomText}>Reset</Text>
        </BouncyPressable>
      </View>

      {/* 2.5D board with animated pawns and dice */}
      <Animated.View style={[styles.boardWrapper, boardAnimatedStyle]}>
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
          style={styles.svg}
        >
          <Defs>
            <LinearGradient id="centerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#0f172a" />
              <Stop offset="50%" stopColor="#1e293b" />
              <Stop offset="100%" stopColor="#0f172a" />
            </LinearGradient>
            <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#fbbf24" />
              <Stop offset="100%" stopColor="#d97706" />
            </LinearGradient>
          </Defs>

          {/* Board Outer Drop Shadow / Base */}
          <Rect
            x="0"
            y="0"
            width={BOARD_SIZE}
            height={BOARD_SIZE}
            fill="#090d16"
            stroke="#475569"
            strokeWidth="3"
            rx="12"
          />

          {/* Center Area */}
          <Rect
            x={CORNER_SIZE}
            y={CORNER_SIZE}
            width={BOARD_SIZE - CORNER_SIZE * 2}
            height={BOARD_SIZE - CORNER_SIZE * 2}
            fill="url(#centerGrad)"
            stroke="#334155"
            strokeWidth="2"
          />

          {/* Center Brand Emblem */}
          <G transform="translate(500, 470)">
            <Path
              d="M 0 -140 L 190 0 L 0 140 L -190 0 Z"
              fill="rgba(15, 23, 42, 0.85)"
              stroke="url(#goldGrad)"
              strokeWidth="4"
            />
            <SvgText
              x="0"
              y="-10"
              fill="url(#goldGrad)"
              fontSize="44"
              fontWeight="900"
              letterSpacing="4"
              textAnchor="middle"
            >
              RUNOPOLY
            </SvgText>
            <SvgText
              x="0"
              y="30"
              fill="#94a3b8"
              fontSize="14"
              fontWeight="600"
              letterSpacing="2"
              textAnchor="middle"
            >
              CLASSIC MONOPOLY EDITION
            </SvgText>

            {gameState?.freeParkingPot && gameState.freeParkingPot > 0 ? (
              <G transform="translate(0, 80)">
                <Rect
                  x="-120"
                  y="-18"
                  width="240"
                  height="36"
                  rx="18"
                  fill="#f59e0b"
                />
                <SvgText
                  x="0"
                  y="5"
                  fill="#000000"
                  fontSize="15"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  🚗 Free Parking: ${gameState.freeParkingPot}
                </SvgText>
              </G>
            ) : null}

            {gameState?.lastDiceRoll && (
              <G transform="translate(0, 150)">
                <Rect
                  x="-55"
                  y="-25"
                  width="50"
                  height="50"
                  rx="8"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                />
                <SvgText
                  x="-30"
                  y="10"
                  fill="#0f172a"
                  fontSize="28"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {gameState.lastDiceRoll.dice[0]}
                </SvgText>

                <Rect
                  x="5"
                  y="-25"
                  width="50"
                  height="50"
                  rx="8"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                />
                <SvgText
                  x="30"
                  y="10"
                  fill="#0f172a"
                  fontSize="28"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {gameState.lastDiceRoll.dice[1]}
                </SvgText>
              </G>
            )}
          </G>

          {BOARD_SPACES.map(renderTile)}
        </Svg>

        <BoardTilePressLayer boardSize={boardPixelSize} />
        <TokenLayer players={players} boardSize={boardPixelSize} />
        <DiceOverlay
          dice={dice}
          triggerKey={diceTriggerKey}
          boardSize={boardPixelSize}
        />
      </Animated.View>
    </View>
  );
};

const screenWidth = Dimensions.get("window").width;
const boardPixelSize = Math.min(screenWidth * 0.96, 720);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  zoomBar: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  zoomButton: {
    backgroundColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  zoomText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "600",
  },
  boardWrapper: {
    width: boardPixelSize,
    height: boardPixelSize,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  svg: {
    borderRadius: 12,
  },
});
