import os
import sys
import importlib.util

current_dir = os.path.dirname(os.path.abspath(__file__))
pyd_file = os.path.join(current_dir, "filter.cp311-win_amd64.pyd")

if os.path.exists(pyd_file):
    spec = importlib.util.spec_from_file_location("_filter", pyd_file)
    _filter = importlib.util.module_from_spec(spec)
    sys.modules["_filter"] = _filter
    spec.loader.exec_module(_filter)

    apply_filter_cpp = _filter.apply_filter_cpp
else:
    def apply_filter_cpp(data, width, height, filter_name):
        print(f"Заглушка фільтру: {filter_name}")
        return data