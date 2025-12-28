import cv from "@techstark/opencv-js";

export function templateMatching(testImg: cv.Mat, templateImg: cv.Mat): number {
    /**
     * Simple template matching using normalized cross-correlation.
     * Works well for exact matches but not rotation/scale invariant.
     */
    let result = new cv.Mat();
    cv.matchTemplate(testImg, templateImg, result, cv.TM_CCOEFF_NORMED);

    let minMax = cv.minMaxLoc(result, null);
    const similarity = minMax.maxVal;

    result.delete();
    return similarity;
}

export function huMomentsMatching(img1: cv.Mat, img2: cv.Mat): number {
    /**
     * Compare using Hu Moments (scale/rotation/translation invariant).
     * Returns similarity score between 0 and 1.
     */
    // Binarize images
    let bin1 = new cv.Mat();
    let bin2 = new cv.Mat();
    cv.threshold(img1, bin1, 127, 255, cv.THRESH_BINARY_INV);
    cv.threshold(img2, bin2, 127, 255, cv.THRESH_BINARY_INV);

    // Calculate moments
    const moments1 = cv.moments(bin1);
    const moments2 = cv.moments(bin2);

    // Calculate Hu moments
    let hu1 = new cv.Mat();
    let hu2 = new cv.Mat();
    cv.HuMoments(moments1, hu1);
    cv.HuMoments(moments2, hu2);

    // Log transform for better comparison
    const logHu1: number[] = [];
    const logHu2: number[] = [];
    for (let i = 0; i < 7; i++) {
        const val1 = hu1.data64F[i];
        const val2 = hu2.data64F[i];
        logHu1.push(-Math.sign(val1) * Math.log10(Math.abs(val1) + 1e-10));
        logHu2.push(-Math.sign(val2) * Math.log10(Math.abs(val2) + 1e-10));
    }

    // Calculate Euclidean distance
    let distance = 0;
    for (let i = 0; i < 7; i++) {
        distance += Math.pow(logHu1[i] - logHu2[i], 2);
    }
    distance = Math.sqrt(distance);

    // Clean up
    bin1.delete();
    bin2.delete();
    hu1.delete();
    hu2.delete();

    // Convert distance to similarity
    return 1.0 / (1.0 + distance);
}

export function histogramMatching(img1: cv.Mat, img2: cv.Mat): number {
    /**
     * Compare histograms of two images.
     * Good for overall shape/intensity distribution.
     */

    let bin1 = new cv.MatVector();
    let bin2 = new cv.MatVector();
    cv.split(img1, bin1);
    cv.split(img2, bin2);

    // Calculate histograms
    let hist1 = new cv.Mat();
    let hist2 = new cv.Mat();

    const histSize = [256];
    const ranges = [0, 256];
    const channels = [0];

    cv.calcHist(bin1, channels, new cv.Mat(), hist1, histSize, ranges);
    cv.calcHist(bin2, channels, new cv.Mat(), hist2, histSize, ranges);

    // Normalize histograms
    cv.normalize(hist1, hist1, 0, 1, cv.NORM_MINMAX);
    cv.normalize(hist2, hist2, 0, 1, cv.NORM_MINMAX);

    // Compare histograms using correlation
    const similarity = cv.compareHist(hist1, hist2, cv.HISTCMP_CORREL);

    // Clean up
    hist1.delete();
    hist2.delete();

    return similarity;
}

export function contourAreaMatching(img1: cv.Mat, img2: cv.Mat): number {
    /**
     * Compare contour areas and perimeters.
     * Fast but basic geometric comparison.
     */
    // Binarize images
    let bin1 = new cv.Mat();
    let bin2 = new cv.Mat();
    cv.threshold(img1, bin1, 127, 255, cv.THRESH_BINARY_INV);
    cv.threshold(img2, bin2, 127, 255, cv.THRESH_BINARY_INV);

    // Find contours
    let contours1 = new cv.MatVector();
    let contours2 = new cv.MatVector();
    cv.findContours(bin1, contours1, new cv.Mat(), cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    cv.findContours(bin2, contours2, new cv.Mat(), cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    if (contours1.size() === 0 || contours2.size() === 0) {
        bin1.delete();
        bin2.delete();
        contours1.delete();
        contours2.delete();
        return 0.0;
    }

    // Get largest contour from each
    let maxArea1 = 0, maxArea2 = 0;
    let maxPerimeter1 = 0, maxPerimeter2 = 0;

    for (let i = 0; i < contours1.size(); i++) {
        const contour = contours1.get(i);
        const area = cv.contourArea(contour);
        const perimeter = cv.arcLength(contour, true);
        if (area > maxArea1) {
            maxArea1 = area;
            maxPerimeter1 = perimeter;
        }
    }

    for (let i = 0; i < contours2.size(); i++) {
        const contour = contours2.get(i);
        const area = cv.contourArea(contour);
        const perimeter = cv.arcLength(contour, true);
        if (area > maxArea2) {
            maxArea2 = area;
            maxPerimeter2 = perimeter;
        }
    }

    // Clean up
    bin1.delete();
    bin2.delete();
    contours1.delete();
    contours2.delete();

    // Compare areas and perimeters
    const areaDiff = Math.abs(maxArea1 - maxArea2) / Math.max(maxArea1, maxArea2);
    const perimeterDiff = Math.abs(maxPerimeter1 - maxPerimeter2) / Math.max(maxPerimeter1, maxPerimeter2);

    const similarity = 1.0 - (areaDiff + perimeterDiff) / 2;
    return Math.max(0, similarity);
}

export function shapeMatching(img1: cv.Mat, img2: cv.Mat): number {
    // Binarize images
    let dst1 = new cv.Mat();
    let dst2 = new cv.Mat();
    cv.threshold(img1, dst1, 127, 255, cv.THRESH_BINARY_INV);
    cv.threshold(img2, dst2, 127, 255, cv.THRESH_BINARY_INV);

    // Find contours
    let contours1 = new cv.MatVector();
    let contours2 = new cv.MatVector();
    cv.findContours(dst1, contours1, new cv.Mat(), cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    cv.findContours(dst2, contours2, new cv.Mat(), cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    if (contours1.size() !== contours2.size()) {
        // No contours found in either image
        contours1.delete();
        contours2.delete();
        return 0.0;
    }

    // Clean up
    dst1.delete();
    dst2.delete();

    // Compare all contours between img1 and img2
    const distances = [];
    for (let i = 0; i < contours2.size(); ++i) {
        let contour2 = contours2.get(i);
        let best_distance = Number.POSITIVE_INFINITY;
        for (let j = 0; j < contours1.size(); ++j) {
            let contour1 = contours1.get(j);
            const distance = cv.matchShapes(contour1, contour2, cv.CONTOURS_MATCH_I2, 0);
            if (distance < best_distance) {
                best_distance = distance;
            }
        }
        distances.push(best_distance);
    }

    // Clean up contours
    contours1.delete();
    contours2.delete();

    // Calculate mean distance
    const meanDistance = distances.reduce((a, b) => a + b, 0);
    const simularity = meanDistance / distances.length;
    return 1.0 / (1.0 + simularity);
}

export function featureMatching(img1: cv.Mat, img2: cv.Mat): number {
    // FAST for keypoint detection
    const fast = new cv.FastFeatureDetector();
    let kp1 = new cv.KeyPointVector();
    let kp2 = new cv.KeyPointVector();
    fast.detect(img1, kp1);
    fast.detect(img2, kp2);

    if (kp1.size() === 0 || kp2.size() === 0) {
        // No keypoints detected in one of the images
        kp1.delete();
        kp2.delete();
        return 0.0;
    }

    // ORB for keypoint description
    const orb = new cv.ORB();
    let des1 = new cv.Mat();
    let des2 = new cv.Mat();
    orb.compute(img1, kp1, des1);
    orb.compute(img2, kp2, des2);

    const kp1_size = kp1.size();

    // Brute-Force matching
    const bf = new cv.BFMatcher(cv.NORM_HAMMING, false);
    let matches = new cv.DMatchVectorVector();
    bf.knnMatch(des1, des2, matches, 2);

    // Apply ratio test
    const good_matches = []
    for (let i = 0; i < matches.size(); i++) {
        const m = matches.get(i).get(0);
        const n = matches.get(i).get(1);
        if (m.distance < 0.7 * n.distance) {
            good_matches.push(m);
        }
    }

    // Clean up
    kp1.delete();
    kp2.delete();
    des1.delete();
    des2.delete();
    matches.delete();

    // Calculate similarity
    const similarity = good_matches.length / kp1_size;
    return similarity;
}

export function combinedMatching(img1: cv.Mat, img2: cv.Mat): number {
    /**
     * Combined approach using multiple methods.
     * Weights optimized for symbol recognition.
     */
    // Convert to grayscale
    let gray1 = new cv.Mat();
    let gray2 = new cv.Mat();
    cv.cvtColor(img1, gray1, cv.COLOR_RGBA2GRAY);
    cv.cvtColor(img2, gray2, cv.COLOR_RGBA2GRAY);

    // Compute multiple similarities
    const huScore = huMomentsMatching(gray1, gray2);
    const shapeScore = shapeMatching(gray1, gray2);
    const featureScore = featureMatching(gray1, gray2);
    const histScore = histogramMatching(gray1, gray2);
    const contourScore = contourAreaMatching(gray1, gray2);

    console.log(`Hu: ${huScore.toFixed(4)}, Shape: ${shapeScore.toFixed(4)}, Feature: ${featureScore.toFixed(4)}, Hist: ${histScore.toFixed(4)}, Contour: ${contourScore.toFixed(4)}`);

    // Weighted combination
    const totalSim =
        shapeScore * 0.5 +
        contourScore * 0.1 +
        featureScore * 0.4;

    // Clean up
    gray1.delete();
    gray2.delete();

    return totalSim;
}

export function testImageMatching(img1: cv.Mat, img2: cv.Mat): number {
    // Convert to grayscale
    let dst1 = new cv.Mat();
    let dst2 = new cv.Mat();
    cv.cvtColor(img1, dst1, cv.COLOR_RGBA2GRAY);
    cv.cvtColor(img2, dst2, cv.COLOR_RGBA2GRAY);

    // Compute similarities
    const ssim = shapeMatching(dst1, dst2);
    const fsim = featureMatching(dst1, dst2);
    const totalSim = ssim * 0.5 + fsim * 0.5;

    console.log(`Shape: ${ssim.toFixed(4)}, Feature: ${fsim.toFixed(4)}`);

    // Clean up
    dst1.delete();
    dst2.delete();

    return totalSim;
}
