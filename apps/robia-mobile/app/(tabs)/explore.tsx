import { StyleSheet } from 'react-native';


export default function TabTwoScreen() {
  return (
    <view style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      Explored
    </view>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
