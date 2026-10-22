import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from "react-native";
import { useGameStore } from "../../store/gameStore";
import { getSpace, COLOR_GROUP_COLORS } from "../../data/boardData";
import { socketService } from "../../services/socketService";

export const DeedModal: React.FC = () => {
  const activeModal = useGameStore((s) => s.activeModal);
  const selectedSpaceId = useGameStore((s) => s.selectedSpaceId);
  const setActiveModal = useGameStore((s) => s.setActiveModal);
  const gameState = useGameStore((s) => s.gameState);
  const myPlayerId = useGameStore((s) => s.playerId);

  if (activeModal !== "deed" || selectedSpaceId === null) return null;

  const space = getSpace(selectedSpaceId);
  const prop = gameState?.properties[selectedSpaceId];
  const owner = prop?.ownerId ? gameState?.players[prop.ownerId] : null;
  const isMine = prop?.ownerId === myPlayerId;
  const color = COLOR_GROUP_COLORS[space.group];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header Color Strip */}
          <View style={[styles.header, { backgroundColor: color }]}>
            <Text style={styles.titleDeed}>TITLE DEED</Text>
            <Text style={styles.propertyName}>{space.name.toUpperCase()}</Text>
          </View>

          <ScrollView style={styles.body}>
            {space.type === "property" && space.rent.length >= 6 ? (
              <View style={styles.rentTable}>
                <View style={styles.rentRow}>
                  <Text style={styles.rentLabel}>Rent (Unimproved)</Text>
                  <Text style={styles.rentVal}>${space.rent[0]}</Text>
                </View>
                <View style={styles.rentRow}>
                  <Text style={styles.rentLabel}>With Color Group (Monopoly)</Text>
                  <Text style={styles.rentVal}>${(space.rent[0] ?? 0) * 2}</Text>
                </View>
                <View style={styles.rentRow}>
                  <Text style={styles.rentLabel}>With 1 House</Text>
                  <Text style={styles.rentVal}>${space.rent[1]}</Text>
                </View>
                <View style={styles.rentRow}>
                  <Text style={styles.rentLabel}>With 2 Houses</Text>
                  <Text style={styles.rentVal}>${space.rent[2]}</Text>
                </View>
                <View style={styles.rentRow}>
                  <Text style={styles.rentLabel}>With 3 Houses</Text>
                  <Text style={styles.rentVal}>${space.rent[3]}</Text>
                </View>
                <View style={styles.rentRow}>
                  <Text style={styles.rentLabel}>With 4 Houses</Text>
                  <Text style={styles.rentVal}>${space.rent[4]}</Text>
                </View>
                <View style={[styles.rentRow, styles.hotelRow]}>
                  <Text style={styles.hotelLabel}>With HOTEL</Text>
                  <Text style={styles.hotelVal}>${space.rent[5]}</Text>
                </View>
              </View>
            ) : space.type === "railroad" ? (
              <View style={styles.rentTable}>
                <View style={styles.rentRow}>
                  <Text style={styles.rentLabel}>Rent 1 Railroad</Text>
                  <Text style={styles.rentVal}>$25</Text>
                </View>
                <View style={styles.rentRow}>
                  <Text style={styles.rentLabel}>Rent 2 Railroads</Text>
                  <Text style={styles.rentVal}>$50</Text>
                </View>
                <View style={styles.rentRow}>
                  <Text style={styles.rentLabel}>Rent 3 Railroads</Text>
                  <Text style={styles.rentVal}>$100</Text>
                </View>
                <View style={styles.rentRow}>
                  <Text style={styles.rentLabel}>Rent 4 Railroads</Text>
                  <Text style={styles.rentVal}>$200</Text>
                </View>
              </View>
            ) : (
              <View style={styles.rentTable}>
                <Text style={styles.rentLabel}>1 Utility Owned: 4x Dice Total</Text>
                <Text style={styles.rentLabel}>2 Utilities Owned: 10x Dice Total</Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.statusBox}>
              <Text style={styles.statusLine}>
                Owner:{" "}
                <Text style={{ fontWeight: "bold", color: owner ? "#38bdf8" : "#94a3b8" }}>
                  {owner ? `${owner.nickname}${isMine ? " (You)" : ""}` : "Bank / Unowned"}
                </Text>
              </Text>
              {prop?.houses ? (
                <Text style={styles.statusLine}>
                  Buildings: {prop.houses === 5 ? "🏨 Hotel" : `🏡 ${prop.houses} House(s)`}
                </Text>
              ) : null}
              {prop?.isMortgaged ? (
                <Text style={[styles.statusLine, { color: "#ef4444", fontWeight: "bold" }]}>
                  ⚠️ Property is Mortgaged
                </Text>
              ) : null}
            </View>

            {isMine && gameState?.status === "PLAYING" && (
              <View style={styles.actionsBox}>
                {space.type === "property" && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.btnGreen]}
                      onPress={() => socketService.buildHouse(space.id)}
                    >
                      <Text style={styles.actionBtnText}>+ Build House (${space.houseCost})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.btnOrange]}
                      onPress={() => socketService.sellHouse(space.id)}
                    >
                      <Text style={styles.actionBtnText}>- Sell House</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.actionRow}>
                  {!prop?.isMortgaged ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.btnRed]}
                      onPress={() => socketService.mortgageProperty(space.id)}
                    >
                      <Text style={styles.actionBtnText}>Mortgage (+${space.mortgageValue})</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.btnBlue]}
                      onPress={() => socketService.unmortgageProperty(space.id)}
                    >
                      <Text style={styles.actionBtnText}>
                        Unmortgage (-${Math.round(space.mortgageValue * 1.1)})
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveModal(null)}>
            <Text style={styles.closeBtnText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#0f172a",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#334155",
  },
  header: {
    paddingVertical: 14,
    alignItems: "center",
  },
  titleDeed: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },
  propertyName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 2,
  },
  body: {
    maxHeight: 380,
    padding: 16,
  },
  rentTable: {
    gap: 6,
  },
  rentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hotelRow: {
    marginTop: 4,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    padding: 4,
    borderRadius: 6,
  },
  rentLabel: {
    color: "#94a3b8",
    fontSize: 13,
  },
  rentVal: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "bold",
  },
  hotelLabel: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "bold",
  },
  hotelVal: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: 12,
  },
  statusBox: {
    backgroundColor: "#1e293b",
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  statusLine: {
    color: "#cbd5e1",
    fontSize: 13,
  },
  actionsBox: {
    marginTop: 12,
    gap: 8,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  btnGreen: {
    backgroundColor: "#16a34a",
  },
  btnOrange: {
    backgroundColor: "#ea580c",
  },
  btnRed: {
    backgroundColor: "#dc2626",
  },
  btnBlue: {
    backgroundColor: "#2563eb",
  },
  closeBtn: {
    backgroundColor: "#1e293b",
    paddingVertical: 14,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  closeBtnText: {
    color: "#f8fafc",
    fontWeight: "bold",
    fontSize: 14,
  },
});
