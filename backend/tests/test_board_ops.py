import pytest

from pm_backend.board_ops import BoardOperation, apply_operations
from pm_backend.models import BoardData
from pathlib import Path

SEED_PATH = (
    Path(__file__).resolve().parents[1] / "pm_backend" / "seed" / "board.example.json"
)


@pytest.fixture()
def sample_board() -> BoardData:
    return BoardData.model_validate_json(SEED_PATH.read_text(encoding="utf-8"))


def test_rename_column(sample_board: BoardData):
    updated = apply_operations(
        sample_board,
        [
            BoardOperation(
                type="rename_column",
                columnId="col-review",
                title="Under Review",
            )
        ],
    )
    review = next(c for c in updated.columns if c.id == "col-review")
    assert review.title == "Under Review"


def test_add_and_delete_card(sample_board: BoardData):
    updated = apply_operations(
        sample_board,
        [
            BoardOperation(
                type="add_card",
                columnId="col-backlog",
                title="New task",
                details="Details",
            )
        ],
    )
    new_ids = set(updated.cards) - set(sample_board.cards)
    assert len(new_ids) == 1
    new_id = new_ids.pop()
    assert updated.cards[new_id].title == "New task"

    updated = apply_operations(
        updated,
        [BoardOperation(type="delete_card", cardId=new_id)],
    )
    assert new_id not in updated.cards
