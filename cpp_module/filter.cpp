#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <vector>
#include <string>
#include <algorithm>

namespace py = pybind11;

std::vector<uint8_t> invert_filter(const std::vector<uint8_t>& data, int width, int height) {
    std::vector<uint8_t> result = data;
    for (size_t i = 0; i + 3 < result.size(); i += 4) {
        result[i + 0] = 255 - result[i + 0]; // R
        result[i + 1] = 255 - result[i + 1]; // G
        result[i + 2] = 255 - result[i + 2]; // B
        // alpha оставляем без изменений
    }
    return result;
}

std::vector<uint8_t> blur_filter(const std::vector<uint8_t>& data, int width, int height) {
    std::vector<uint8_t> result(data.size());

    auto get_pixel = [&](int x, int y, int channel) -> uint8_t {
        x = std::clamp(x, 0, width - 1);
        y = std::clamp(y, 0, height - 1);
        size_t index = (y * width + x) * 4 + channel;
        return data[index];
    };

    float kernel[3][3] = {
        {1.f, 2.f, 1.f},
        {2.f, 4.f, 2.f},
        {1.f, 2.f, 1.f}
    };
    float kernel_sum = 16.f;

    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            float r = 0, g = 0, b = 0;
            float a = 0;

            for (int ky = -1; ky <= 1; ++ky) {
                for (int kx = -1; kx <= 1; ++kx) {
                    int px = x + kx;
                    int py = y + ky;
                    float weight = kernel[ky + 1][kx + 1];

                    r += get_pixel(px, py, 0) * weight;
                    g += get_pixel(px, py, 1) * weight;
                    b += get_pixel(px, py, 2) * weight;
                    a += get_pixel(px, py, 3) * weight;
                }
            }

            size_t index = (y * width + x) * 4;
            result[index + 0] = static_cast<uint8_t>(r / kernel_sum);
            result[index + 1] = static_cast<uint8_t>(g / kernel_sum);
            result[index + 2] = static_cast<uint8_t>(b / kernel_sum);
            result[index + 3] = static_cast<uint8_t>(a / kernel_sum);
        }
    }

    return result;
}

std::vector<uint8_t> grayscale_filter(const std::vector<uint8_t>& data, int width, int height) {
    std::vector<uint8_t> result = data;
    for (size_t i = 0; i + 3 < data.size(); i += 4) {
        uint8_t r = data[i];
        uint8_t g = data[i + 1];
        uint8_t b = data[i + 2];
        uint8_t gray = static_cast<uint8_t>(0.299 * r + 0.587 * g + 0.114 * b);
        result[i + 0] = gray;
        result[i + 1] = gray;
        result[i + 2] = gray;
        // alpha (i + 3) не трогаем
    }
    return result;
}

std::vector<uint8_t> duotone_filter(const std::vector<uint8_t>& data, int width, int height) {
    std::vector<uint8_t> result = data;
    uint8_t color1[3] = {128, 0, 255};  // фиолетовый
    uint8_t color2[3] = {255, 255, 0};  // жёлтый

    for (size_t i = 0; i + 3 < data.size(); i += 4) {
        uint8_t r = data[i];
        uint8_t g = data[i + 1];
        uint8_t b = data[i + 2];
        float gray = (0.299f * r + 0.587f * g + 0.114f * b) / 255.f;

        for (int c = 0; c < 3; ++c) {
            result[i + c] = static_cast<uint8_t>(color1[c] * (1 - gray) + color2[c] * gray);
        }
        // alpha — без изменений
    }
    return result;
}

std::vector<uint8_t> posterize_filter(const std::vector<uint8_t>& data, int width, int height, int levels = 4) {
    std::vector<uint8_t> result = data;
    int step = 256 / levels;

    for (size_t i = 0; i + 3 < data.size(); i += 4) {
        for (int j = 0; j < 3; ++j) {
            int val = data[i + j];
            result[i + j] = (val / step) * step;
        }
        // alpha — без изменений
    }
    return result;
}

std::vector<uint8_t> mirror_filter(const std::vector<uint8_t>& data, int width, int height) {
    std::vector<uint8_t> result(data.size());
    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            int src = (y * width + x) * 4;
            int dst = (y * width + (width - x - 1)) * 4;
            for (int c = 0; c < 4; ++c)
                result[dst + c] = data[src + c];
        }
    }
    return result;
}


std::vector<uint8_t> apply_filter_cpp(const std::vector<uint8_t>& data, int width, int height, const std::string& filter_name) {
    if (filter_name == "invert") {
        return invert_filter(data, width, height);
    } else if (filter_name == "blur") {
        return blur_filter(data, width, height);
    } else if (filter_name == "grayscale") {
        return grayscale_filter(data, width, height);
    } else if (filter_name == "duotone") {
        return duotone_filter(data, width, height);
    } else if (filter_name == "posterize") {
        return posterize_filter(data, width, height);
    } else if (filter_name == "mirror") {
        return mirror_filter(data, width, height);
    }

    return data;
}

PYBIND11_MODULE(filter, m) {
    m.def("apply_filter_cpp", &apply_filter_cpp, "Apply a C++ filter to image data");
}
