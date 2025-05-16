# Add description cell after level (first instance)
/placeholder="Select level"/{
N
N
N
N
N
a\
                                                  </TableCell>\
                                                  <TableCell>\
                                                    <Textarea\
                                                      placeholder="Add skill description..."\
                                                      value={skillsList.find(s => s.name === skill.name)?.notes || ""}\
                                                      onChange={(e) => {\
                                                        const description = e.target.value;\
                                                        setSkillsList(prev => \
                                                          prev.map(s => \
                                                            s.name === skill.name \
                                                              ? { ...s, notes: description }\
                                                              : s\
                                                          )\
                                                        );\
                                                      }}\
                                                      disabled={isDisabled || !selectedSkills[skill.name]}\
                                                      className="w-full max-w-xs h-20 text-xs"
}

# Combine the certification cells (first instance)
/placeholder="Certification name"/{
n
n
n
n
n
n
n
n
:loop1
n
/Input/{
  s/placeholder="Certification link"/placeholder="Certification link" className="mt-1 text-xs"/
  s/className="w-full max-w-xs"/className="w-full max-w-xs text-xs"/
}
}

# Add description cell after level (second instance)
/SelectItem value="expert">Expert<\/SelectItem>/{
N
N
N
N
N
a\
                                                  </TableCell>\
                                                  <TableCell>\
                                                    <Textarea\
                                                      placeholder="Add skill description..."\
                                                      value={skillsList.find(s => s.name === skill.name)?.notes || ""}\
                                                      onChange={(e) => {\
                                                        const description = e.target.value;\
                                                        setSkillsList(prev => \
                                                          prev.map(s => \
                                                            s.name === skill.name \
                                                              ? { ...s, notes: description }\
                                                              : s\
                                                          )\
                                                        );\
                                                      }}\
                                                      disabled={isDisabled || !selectedSkills[skill.name]}\
                                                      className="w-full max-w-xs h-20 text-xs"
}

# Combine certification cells (second instance)
/placeholder="Certification name"/{
n
n
n
n
n
n
n
n
:loop2
n
/Input/{
  s/placeholder="Certification link"/placeholder="Certification link" className="mt-1 text-xs"/
  s/className="w-full max-w-xs"/className="w-full max-w-xs text-xs"/
}
}
