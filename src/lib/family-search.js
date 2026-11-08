export function filterFamilies(families, params) {
  const normalizeDestination = (value) => value.toLocaleLowerCase("de").replace(/[,\s]+/g, " ").trim();
  const destination = normalizeDestination(params.get("destination") ?? "");
  const ages = params.getAll("childAge");
  const genders = params.getAll("childGender");
  const requested = Array.from({ length: Math.max(ages.length, genders.length) }, (_, index) => ({
    age: ages[index] !== undefined && ages[index] !== "" ? Number(ages[index]) : null,
    gender: genders[index] || "",
  })).filter((child) => child.age !== null || child.gender);
  const languages = params.getAll("language");
  const ageRange = params.get("age");
  const [minAge, maxAge] = ageRange ? ageRange.split("-").map(Number) : [0, Infinity];
  const start = params.get("start");
  const end = params.get("end");

  return families.filter((family) => {
    const matchesChildren = (index, available) => {
      if (index === requested.length) return true;
      const child = requested[index];
      return available.some((candidate, candidateIndex) =>
        (child.age === null || Math.abs(candidate.age - child.age) <= 2)
        && (!child.gender || child.gender === candidate.gender)
        && matchesChildren(index + 1, available.filter((_, i) => i !== candidateIndex)));
    };
    return (!destination || normalizeDestination(`${family.destination} ${family.country ?? ""} ${family.region ?? ""}`).includes(destination))
      && (!languages.length || languages.some((language) => family.languages.includes(language)))
      && matchesChildren(0, family.children)
      && (!ageRange || family.children.some((child) => child.age >= minAge && child.age <= maxAge))
      && (!start || family.end_date >= start) && (!end || family.start_date <= end);
  });
}
