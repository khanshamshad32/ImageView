import React, { useState, useRef, useEffect } from "react";
import {
	Image,
	View,
	PanResponder,
	Modal,
	UIManager,
	findNodeHandle,
} from "react-native";

const HIDING_FRAMES_COUNT = 6;
const FRAME_UPDATE_TIME = 17;

const getAbsolutePosition = (node, callback) => {
	const handle = findNodeHandle(node);
	UIManager.measureInWindow(handle, (x, y, w, h) => {
		callback({ x, y, w, h });
	});
};

const isTouchInsideFrame = (frame, touch) => {
	let x = touch.pageX;
	let y = touch.pageY;
	if (
		frame.x > x ||
		frame.x + frame.w < x ||
		frame.y > y ||
		frame.y + frame.h < y
	) {
		return false;
	}

	return true;
};

const getDist = (a, b) => {
	return Math.sqrt(
		Math.pow(a.locationX - b.locationX, 2) +
			Math.pow(a.locationY - b.locationY, 2)
	);
};

const updateOverlayFrame = (prePinch, currPinch, overlayLayout) => {
	let { initial, current } = overlayLayout;

	let { w, h, x, y } = current;
	let dw =
		(getDist(currPinch[0], currPinch[1]) - getDist(prePinch[0], prePinch[1])) *
		3;

	if (initial.w <= w + dw && 7 * initial.w >= w + dw) {
		w += dw;
		h *= w / current.w;
		x -= (w - current.w) / 2;
		y -= (h - current.h) / 2;
	}
	x += 1 * (currPinch[0].pageX - prePinch[0].pageX);
	y += 1 * (currPinch[0].pageY - prePinch[0].pageY);
	return { x, y, w, h };
};

const ImageView = ({
	style,
	source,
	placeholderSrc,
	resizeMode,
	onZoomBegin,
	onZoomEnd,
	...props
}) => {
	const createResponder = () => {
		return PanResponder.create({
			onStartShouldSetPanResponder: (evt, gestureState) => {
				let touches = evt.nativeEvent.touches;
				if (touches.length === 2) {
					getAbsolutePosition(imgRef.current, (rect) => {
						if (
							gestureState.numberActiveTouches === 2 && // check no of touches active currently
							isTouchInsideFrame(rect, touches[1])
						) {
							state.pinch = { current: touches, previous: touches };
							state.overlayLayout = { current: rect, initial: rect };
							state.showModal = true;
							setState({ ...state });
						}
					});
					return true;
				}
				return false;
			},
			onPanResponderMove: (evt, gestureState) => {
				let { overlayLayout } = state;
				let touches = evt.nativeEvent.touches;
				if (overlayLayout && touches.length === 2) {
					let { pinch } = state;
					let frame = updateOverlayFrame(pinch.current, touches, overlayLayout);
					state.pinch = { previous: pinch.current, current: touches };
					state.overlayLayout = { ...overlayLayout, current: frame };
					setState({ ...state });
				}
			},
			onPanResponderRelease: hideOverlay,
			onPanResponderTerminate: hideOverlay,
			onPanResponderReject: hideOverlay,
			onPanResponderTerminationRequest: () => false,
		});
	};

	const hideOverlay = () => {
		let { overlayLayout } = state;

		if (!overlayLayout) {
			return;
		}
		let { initial, current } = overlayLayout;

		let dx = (current.x - initial.x) / HIDING_FRAMES_COUNT;
		let dy = (current.y - initial.y) / HIDING_FRAMES_COUNT;
		let dw = (current.w - initial.w) / HIDING_FRAMES_COUNT;
		let dh = (current.h - initial.h) / HIDING_FRAMES_COUNT;
		let ctr = 0;
		const updateOverlay = () => {
			++ctr;
			if (current.w > initial.w && ctr <= HIDING_FRAMES_COUNT) {
				current.x -= dx;
				current.y -= dy;
				current.w -= dw;
				current.h -= dh;
				setState({ ...state, overlayLayout: { ...overlayLayout, current } });
				setTimeout(() => updateOverlay(), FRAME_UPDATE_TIME);
			} else {
				setState({ ...state, showModal: false });
				setTimeout(() => {
					state.overlayLayout = undefined;
					state.pinch = undefined;
					state.showModal = false;
					setState({ ...state });
				}, FRAME_UPDATE_TIME);
			}
		};
		updateOverlay();
	};

	const [state, setState] = useState({ ...defaultState });
	const [panResponder] = useState(createResponder());
	const imgRef = useRef(null);

	useEffect(() => {
		if (state.showModal !== undefined) {
			state.showModal ? onZoomBegin() : onZoomEnd();
		}
	}, [state.showModal]);

	const getOverlayStyle = () => {
		let { current, initial } = state.overlayLayout;
		let { x, y, w, h } = current;
		let alpha = (w / initial.w - 1) / 6;

		return {
			imageStyle: {
				position: "absolute",
				left: x,
				top: y,
				width: w,
				height: h,
			},
			modalBgColor: `rgba(0,0,0,${alpha})`,
		};
	};

	if (state.overlayLayout && placeholderSrc) {
		source = placeholderSrc;
	}
	return (
		<>
			<Image
				ref={imgRef}
				style={style}
				source={source}
				resizeMode={resizeMode}
				{...props}
				{...panResponder.panHandlers}
			/>
			{state.overlayLayout ? (
				<Modal
					visible={state.showModal}
					animated={false}
					animationType="none"
					transparent={true}>
					{(function () {
						let _style = getOverlayStyle();
						return (
							<View
								style={{
									flex: 1,
									backgroundColor: _style.modalBgColor,
								}}>
								<Image
									source={source}
									resizeMode={resizeMode}
									style={_style.imageStyle}
								/>
							</View>
						);
					})()}
				</Modal>
			) : null}
		</>
	);
};

const defaultState = {
	showModal: undefined,
	overlayLayout: undefined,
	pinch: undefined,
};

export default ImageView;
