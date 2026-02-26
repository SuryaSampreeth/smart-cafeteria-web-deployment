/*
 * Constants for wait time estimation.
 * Assumes average service time is 5 minutes per person.
 */
const AVERAGE_SERVICE_TIME = 5;

/*
 * Calculates estimated wait time.
 * Logic: Current Position * Average Time Per Person.
 * If you are #3 in queue, wait time is 15 minutes.
 */
const calculateWaitingTime = (queuePosition) => {
    return queuePosition * AVERAGE_SERVICE_TIME;
};

module.exports = { calculateWaitingTime };
