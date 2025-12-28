import cv from "@techstark/opencv-js";

function shapeMatching(img1: cv.Mat, img2: cv.Mat): number {
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

function featureMatching(img1: cv.Mat, img2: cv.Mat): number {
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

export default function testImageMatching(img1: cv.Mat, img2: cv.Mat): number {
    // Convert to grayscale
    let dst1 = new cv.Mat();
    let dst2 = new cv.Mat();
    cv.cvtColor(img1, dst1, cv.COLOR_RGBA2GRAY);
    cv.cvtColor(img2, dst2, cv.COLOR_RGBA2GRAY);

    // Compute similarities
    const ssim = shapeMatching(dst1, dst2);
    const fsim = featureMatching(dst1, dst2);
    const totalSim = ssim * 0.5 + fsim * 0.5;

    // Clean up
    dst1.delete();
    dst2.delete();

    return totalSim;
}
