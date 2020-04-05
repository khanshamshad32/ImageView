import React from "react";
import Image from "./ImageView";
import { StyleSheet, FlatList } from "react-native";

const Example = () => {
	const renderItem = ({ item }) => {
		return (
			<Image
				style={styles.imageStyle}
				source={{ uri: `https://i.picsum.photos/id/${item}/300/200.jpg` }}
				onZoomBegin={() => console.log("On Zoom begin")}
				onZoomEnd={() => console.log("On Zoom End")}
			/>
		);
	};
	return (
		<FlatList
			style={styles.containerStyle}
			data={[1074, 1025, 1020, 1003, 1062]}
			renderItem={renderItem}
			keyExtractor={(item) => `${item}`}
		/>
	);
};

const styles = StyleSheet.create({
	containerStyle: {
		margin: 20,
	},
	imageStyle: {
		height: 200,
		width: 300,
		backgroundColor: "#000",
		margin: 10,
	},
});

export default Example;
