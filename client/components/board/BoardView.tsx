import React from "react";
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from "react-native";
import Svg, {
  Rect,
  Text as SvgText,
  G,
  Circle,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { BOARD_SPACES, COLOR_GROUP_COLORS } from "../../data/boardData";
import { getTokenMeta } from "../../data/tokens";
import { useGameStore } from "../../store/gameStore";
import { BoardSpace, Player } from "../../types";

const BOARD_SIZE = 1000;
const CORNER_SIZE = 130;
const TILE_WIDTH = (BOARD_SIZE - CORNER_SIZE * 2) / 9; // 740 / 9 = ~82.22

export interface TileBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  centerX: number;
  centerY: number;
}

export function getTileBounds(id: number): TileBounds {
  if (id === 0) {
    // GO (bottom right)
    return {
      x: BOARD_SIZE - CORNER_SIZE,
      y: BOARD_SIZE - CORNER_SIZE,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      rotation: 0,
      centerX: BOARD_SIZE - CORNER_SIZE / 2,
      centerY: BOARD_SIZE - CORNER_SIZE / 2,
    };
  }
  if (id > 0 && id < 10) {
    // Bottom edge (1..9, right to left)
    const offset = 9 - id;
    const x = CORNER_SIZE + offset * TILE_WIDTH;
    const y = BOARD_SIZE - CORNER_SIZE;
    return {
      x,
      y,
      width: TILE_WIDTH,
      height: CORNER_SIZE,
      rotation: 0,
      centerX: x + TILE_WIDTH / 2,
      centerY: y + CORNER_SIZE / 2,
    };
  }
  if (id === 10) {
    // Jail (bottom left)
    return {
      x: 0,
      y: BOARD_SIZE - CORNER_SIZE,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      rotation: 0,
      centerX: CORNER_SIZE / 2,
      centerY: BOARD_SIZE - CORNER_SIZE / 2,
    };
  }
  if (id > 10 && id < 20) {
    // Left edge (11..19, bottom to top)
    const offset = 19 - id;
    const x = 0;
    const y = CORNER_SIZE + offset * TILE_WIDTH;
    return {
      x,
      y,
      width: CORNER_SIZE,
      height: TILE_WIDTH,
      rotation: 90,
      centerX: CORNER_SIZE / 2,
      centerY: y + TILE_WIDTH / 2,
    };
  }
  if (id === 20) {
    // Free Parking (top left)
    return {
      x: 0,
      y: 0,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      rotation: 0,
      centerX: CORNER_SIZE / 2,
      centerY: CORNER_SIZE / 2,
    };
  }
  if (id > 20 && id < 30) {
    // Top edge (21..29, left to right)
    const offset = id - 21;
    const x = CORNER_SIZE + offset * TILE_WIDTH;
    const y = 0;
    return {
      x,
      y,
      width: TILE_WIDTH,
      height: CORNER_SIZE,
      rotation: 180,
      centerX: x + TILE_WIDTH / 2,
      centerY: CORNER_SIZE / 2,
    };
  }
  if (id === 30) {
    // Go To Jail (top right)
    return {
      x: BOARD_SIZE - CORNER_SIZE,
      y: 0,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      rotation: 0,
      centerX: BOARD_SIZE - CORNER_SIZE / 2,
      centerY: CORNER_SIZE / 2,
    };
  }
  // Right edge (31..39, top to bottom)
  const offset = id - 31;
  const x = BOARD_SIZE - CORNER_SIZE;
  const y = CORNER_SIZE + offset * TILE_WIDTH;
  return {
    x,
    y,
    width: CORNER_SIZE,
    height: TILE_WIDTH,
    rotation: 270,
    centerX: BOARD_SIZE - CORNER_SIZE / 2,
    centerY: y + TILE_WIDTH / 2,
  };
}

export const BoardView: React.FC = () => {
  const gameState = useGameStore((s) => s.gameState);
  const setActiveModal = useGameStore((s) => s.setActiveModal);
  const [zoomLevel, setZoomLevel] = React.useState(1);

  const players: Player[] = gameState ? Object.values(gameState.players) : [];
  const properties = gameState?.properties || {};

  // Group players by current position for pawn layout
  const playersByPosition: Record<number, Player[]> = {};
  for (const p of players) {
    if (!p.isBankrupt) {
      if (!playersByPosition[p.position]) {
        playersByPosition[p.position] = [];
      }
      playersByPosition[p.position]!.push(p);
    }
  }

  const renderTile = (space: BoardSpace) => {
    const b = getTileBounds(space.id);
    const prop = properties[space.id];
    const color = COLOR_GROUP_COLORS[space.group];
    const isProperty = space.type === "property";
    const isCorner = space.id % 10 === 0;

    let stripeHeight = 24;

    return (
      <G
        key={`tile-${space.id}`}
        onPress={() => setActiveModal("deed", space.id)}
      >
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

  const renderPlayerTokens = (spaceId: number) => {
    const occupants = playersByPosition[spaceId] || [];
    if (occupants.length === 0) return null;

    const b = getTileBounds(spaceId);

    return (
      <G key={`pawns-${spaceId}`}>
        {occupants.map((player, idx) => {
          const meta = getTokenMeta(player.token);
          const offsetX = occupants.length === 1 ? 0 : (idx % 2 === 0 ? -12 : 12);
          const offsetY = occupants.length <= 2 ? 0 : (idx < 2 ? -10 : 10);
          const px = b.centerX + offsetX;
          const py = b.centerY + offsetY + (b.height > b.width ? 18 : 6);

          return (
            <G key={`pawn-${player.id}`}>
              <Circle
                cx={px}
                cy={py}
                r="13"
                fill={meta.color}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <SvgText
                x={px}
                y={py + 1}
                fontSize="12"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {meta.emoji}
              </SvgText>
            </G>
          );
        })}
      </G>
    );
  };

  return (
    <View style={styles.container}>
      {/* Zoom controls */}
      <View style={styles.zoomBar}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
        >
          <Text style={styles.zoomText}>＋</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
        >
          <Text style={styles.zoomText}>－</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => setZoomLevel(1)}
        >
          <Text style={styles.zoomText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* SVG Board */}
      <View
        style={[
          styles.boardWrapper,
          {
            transform: [
              { scale: zoomLevel },
              { perspective: 900 },
              { rotateX: "10deg" },
            ],
          },
        ]}
      >
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
          {BOARD_SPACES.map((space) => renderPlayerTokens(space.id))}
        </Svg>
      </View>
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
