import {
	ActivityIndicator,
	Modal,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import sty from "@/constants/styles";

type ConfirmDialogProps = {
	visible: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	loading?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
};

export default function ConfirmDialog({
	visible,
	title,
	message,
	confirmText = "Excluir",
	cancelText = "Cancelar",
	loading = false,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onCancel}
		>
			<View style={styles.overlay}>
				<View style={styles.card}>
					<Text style={styles.title}>{title}</Text>
					<Text style={styles.message}>{message}</Text>
					<View style={styles.actions}>
						<TouchableOpacity
							style={[styles.btn, styles.cancelBtn]}
							onPress={onCancel}
							disabled={loading}
						>
							<Text style={styles.cancelText}>{cancelText}</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.btn, styles.confirmBtn]}
							onPress={onConfirm}
							disabled={loading}
						>
							{loading ? (
								<ActivityIndicator size="small" color={sty.c4} />
							) : (
								<Text style={styles.confirmText}>{confirmText}</Text>
							)}
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.6)",
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	card: {
		width: "100%",
		maxWidth: 420,
		backgroundColor: sty.c8,
		borderRadius: 12,
		padding: 20,
		gap: 12,
	},
	title: {
		color: sty.c4,
		fontSize: 18,
		fontWeight: "700",
	},
	message: {
		color: sty.c5,
		fontSize: 14,
		lineHeight: 20,
	},
	actions: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: 12,
		marginTop: 8,
	},
	btn: {
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 8,
		minWidth: 90,
		alignItems: "center",
	},
	cancelBtn: {
		backgroundColor: sty.c7,
	},
	cancelText: {
		color: sty.c4,
		fontWeight: "600",
	},
	confirmBtn: {
		backgroundColor: sty.c10,
	},
	confirmText: {
		color: sty.c4,
		fontWeight: "600",
	},
});
