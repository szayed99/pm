import json

from pm_backend.database import get_board_json, save_board_json
from pm_backend.models import BoardData, validate_board


def get_board(user_id: int) -> BoardData:
    raw = get_board_json(user_id)
    board = BoardData.model_validate_json(raw)
    validate_board(board)
    return board


def save_board(user_id: int, board: BoardData) -> BoardData:
    validate_board(board)
    save_board_json(user_id, json.dumps(board.model_dump()))
    return board
