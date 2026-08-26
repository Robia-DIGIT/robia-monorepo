import { StyleSheet } from 'react-native';


export default function Profile() {
  return (
    <view style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      Profile
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
